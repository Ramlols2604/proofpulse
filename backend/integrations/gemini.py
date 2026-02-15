"""Gemini API integration for claim review and rubric scoring."""
import httpx
import json
from config import settings
from typing import Dict, List


async def review_and_score_claim(
    claim_text: str,
    context_text: str,
    backboard_verdict: str,
    backboard_confidence: int,
    sources: List[Dict]
) -> Dict:
    """Call Gemini API with structured scoring prompt using REST API."""
    try:
        # Build the scoring prompt
        prompt = build_scoring_prompt(
            claim_text,
            context_text,
            backboard_verdict,
            backboard_confidence,
            sources
        )
        
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        )

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 2048
                    }
                }
            )

        if response.status_code != 200:
            raise Exception(f"Gemini REST {response.status_code}: {response.text[:200]}")

        data = response.json()
        response_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Try to extract JSON if wrapped in markdown
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        
        return result
        
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Fallback to mock response if API fails
        return {
            "gemini_verdict": "UNCLEAR",
            "gemini_confidence": 50,
            "score_breakdown": {
                "evidence_strength": 15,
                "evidence_agreement": 15,
                "context_accuracy": 10,
                "model_confidence_points": 10
            },
            "short_explanation": f"Error calling Gemini API: {str(e)[:100]}",
            "sources_used": [
                {"url": sources[0]["url"], "why": "Primary source"}
            ] if sources else [],
            "context_notes": "API error occurred"
        }


def build_scoring_prompt(
    claim_text: str,
    context_text: str,
    backboard_verdict: str,
    backboard_confidence: int,
    sources: List[Dict]
) -> str:
    """Build the complete Gemini scoring prompt."""
    sources_text = format_sources_for_prompt(sources)
    
    prompt = f"""You are an expert fact checker. Output strict JSON only.

Input:
Claim: {claim_text}
Context snippet: {context_text}
Backboard verdict: {backboard_verdict}
Backboard confidence: {backboard_confidence}
Sources:
{sources_text}

Task:
Score the claim using this rubric. Output JSON only.

Rubric:
- Evidence Strength (0-30): Quality and authority of sources
- Evidence Agreement (0-30): How well sources align
- Context Accuracy (0-20): How well claim matches context
- Model Confidence Points (0-20): 
  combined_conf = 0.60 * {backboard_confidence} + 0.40 * gemini_confidence
  model_confidence_points = round(combined_conf * 0.20)

Guidelines:
- Use provided sources only. Do not invent sources.
- If sources are weak, lower Evidence Strength.
- If sources conflict, lower Evidence Agreement.
- If context is misleading, lower Context Accuracy.
- Set gemini_confidence (0-100) reflecting your certainty.

Output JSON schema:
{{
  "gemini_verdict": "SUPPORTED|MOSTLY_SUPPORTED|UNCLEAR|MOSTLY_CONTRADICTED|CONTRADICTED",
  "gemini_confidence": 0,
  "score_breakdown": {{
    "evidence_strength": 0,
    "evidence_agreement": 0,
    "context_accuracy": 0,
    "model_confidence_points": 0
  }},
  "short_explanation": "string",
  "sources_used": [{{"url":"string","why":"string"}}],
  "context_notes": "string"
}}

IMPORTANT - Verdict Guidelines:
- SUPPORTED (80-100): Claim is TRUE - credible sources confirm the factual statement
- MOSTLY_SUPPORTED (60-79): Claim is MOSTLY TRUE - majority of evidence supports it
- UNCLEAR (40-59): Insufficient evidence to determine truth or falsity
- MOSTLY_CONTRADICTED (20-39): Claim is MOSTLY FALSE - majority of evidence refutes it
- CONTRADICTED (0-19): Claim is FALSE - credible sources disprove the claim

Rules:
- All score fields must be integers in range.
- short_explanation: 2-4 sentences (600-800 characters). Explain:
  1. What the claim states
  2. What credible sources say (support or contradict)
  3. Why the verdict was reached based on evidence quality and agreement
  4. Key context or limitations
- sources_used must reference only given sources.
- Be specific about WHY sources support or contradict the claim.
"""
    return prompt


def format_sources_for_prompt(sources: List[Dict]) -> str:
    """Format sources list for inclusion in Gemini prompt."""
    if not sources:
        return "No sources provided."
    
    formatted = []
    for i, source in enumerate(sources, 1):
        formatted.append(
            f"{i}. {source.get('title', 'Unknown')} | "
            f"{source.get('publisher', 'Unknown')} | "
            f"{source.get('date', 'N/A')} | "
            f"{source.get('url', 'N/A')} | "
            f"{source.get('snippet', 'No snippet')}"
        )
    return "\n".join(formatted)
