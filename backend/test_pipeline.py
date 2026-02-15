"""
Test pipeline with detailed logging to diagnose issues.
Run: python test_pipeline.py
"""
import asyncio
import json
import sys
from datetime import datetime

# Import all pipeline components
try:
    from cache import cache
except:
    from cache_mock import cache

from config import settings
from integrations.backboard import extract_claims, verify_claim, score_claim_backboard_fallback
from integrations.gemini import review_and_score_claim
from scoring import finalize_claim_score, map_score_to_verdict
from models import FinalClaim, FinalBreakdown, Source


def log(stage, message, data=None):
    """Pretty print log messages."""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"\n{'='*80}")
    print(f"[{timestamp}] {stage}")
    print(f"{'='*80}")
    print(message)
    if data:
        print(json.dumps(data, indent=2, default=str))
    print(f"{'='*80}\n")


async def test_full_pipeline():
    """Test the full pipeline with 'The earth is Flat'."""
    
    test_text = "The earth is Flat"
    job_id = "test_earth_flat"
    
    log("SETUP", "Starting pipeline test", {
        "input_text": test_text,
        "job_id": job_id,
        "gemini_enabled": settings.GEMINI_ENABLED,
        "backboard_api_key": settings.BACKBOARD_API_KEY[:20] + "...",
        "gemini_api_key": settings.GEMINI_API_KEY[:20] + "..."
    })
    
    # Initialize job
    cache.initialize_job(job_id, "text", test_text)
    
    # ========================================================================
    # STAGE 1: Text Extraction (trivial for text input)
    # ========================================================================
    log("STAGE 1: TEXT EXTRACTION", "Extracting text from input")
    
    try:
        cache.set_job_data(job_id, "text", test_text)
        log("STAGE 1: SUCCESS", f"Extracted text", {"text": test_text, "length": len(test_text)})
    except Exception as e:
        log("STAGE 1: FAILED", f"Error: {str(e)}")
        return
    
    # ========================================================================
    # STAGE 2: Claim Extraction (Backboard)
    # ========================================================================
    log("STAGE 2: CLAIM EXTRACTION", "Calling Backboard to extract claims")
    
    try:
        claims = await extract_claims(test_text)
        cache.set_job_data(job_id, "claims", claims)
        log("STAGE 2: SUCCESS", f"Extracted {len(claims)} claims", {"claims": claims})
    except Exception as e:
        log("STAGE 2: FAILED", f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return
    
    if not claims or len(claims) == 0:
        log("STAGE 2: FAILED", "No claims extracted!")
        return
    
    # ========================================================================
    # STAGE 3: Evidence Retrieval (Backboard web search)
    # ========================================================================
    log("STAGE 3: EVIDENCE RETRIEVAL", f"Retrieving evidence for {len(claims)} claims")
    
    evidence_results = {}
    for i, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        claim_text = claim["claim_text"]
        
        log(f"STAGE 3.{i}: EVIDENCE", f"Verifying claim: {claim_text}")
        
        try:
            evidence = await verify_claim(claim_text)
            evidence_results[claim_id] = evidence
            
            log(f"STAGE 3.{i}: SUCCESS", f"Retrieved evidence", {
                "verdict": evidence.get("backboard_verdict"),
                "confidence": evidence.get("backboard_confidence"),
                "sources_count": len(evidence.get("sources", [])),
                "sources": evidence.get("sources", [])
            })
        except Exception as e:
            log(f"STAGE 3.{i}: FAILED", f"Error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            evidence_results[claim_id] = {
                "backboard_verdict": "UNCLEAR",
                "backboard_confidence": 0,
                "sources": [],
                "error": str(e)
            }
    
    cache.set_job_data(job_id, "evidence", evidence_results)
    
    # ========================================================================
    # STAGE 4: Gemini Scoring (or Backboard fallback)
    # ========================================================================
    log("STAGE 4: SCORING", f"Scoring claims (Gemini enabled: {settings.GEMINI_ENABLED})")
    
    gemini_results = {}
    for i, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        claim_text = claim["claim_text"]
        evidence = evidence_results.get(claim_id, {})
        
        context_snippet = test_text[:500]
        
        log(f"STAGE 4.{i}: SCORING", f"Scoring claim: {claim_text}", {
            "gemini_enabled": settings.GEMINI_ENABLED,
            "backboard_verdict": evidence.get("backboard_verdict"),
            "backboard_confidence": evidence.get("backboard_confidence"),
            "sources_available": len(evidence.get("sources", []))
        })
        
        # Try Gemini if enabled
        if settings.GEMINI_ENABLED:
            log(f"STAGE 4.{i}: GEMINI", "Attempting Gemini API call...")
            
            try:
                gemini_response = await review_and_score_claim(
                    claim_text=claim_text,
                    context_text=context_snippet,
                    backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                    backboard_confidence=evidence.get("backboard_confidence", 50),
                    sources=evidence.get("sources", [])
                )
                
                gemini_results[claim_id] = gemini_response
                log(f"STAGE 4.{i}: GEMINI SUCCESS", "Gemini returned scores", gemini_response)
            
            except Exception as e:
                log(f"STAGE 4.{i}: GEMINI FAILED", f"Gemini error: {str(e)}")
                import traceback
                print(traceback.format_exc())
                
                log(f"STAGE 4.{i}: FALLBACK", "Using Backboard fallback scoring...")
                try:
                    gemini_response = await score_claim_backboard_fallback(
                        claim_text=claim_text,
                        backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                        backboard_confidence=evidence.get("backboard_confidence", 50),
                        sources=evidence.get("sources", [])
                    )
                    gemini_results[claim_id] = gemini_response
                    log(f"STAGE 4.{i}: FALLBACK SUCCESS", "Backboard fallback returned scores", gemini_response)
                except Exception as fallback_e:
                    log(f"STAGE 4.{i}: FALLBACK FAILED", f"Fallback error: {str(fallback_e)}")
                    import traceback
                    print(traceback.format_exc())
        else:
            log(f"STAGE 4.{i}: BACKBOARD SCORING", "Gemini disabled, using Backboard...")
            
            try:
                gemini_response = await score_claim_backboard_fallback(
                    claim_text=claim_text,
                    backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                    backboard_confidence=evidence.get("backboard_confidence", 50),
                    sources=evidence.get("sources", [])
                )
                gemini_results[claim_id] = gemini_response
                log(f"STAGE 4.{i}: BACKBOARD SUCCESS", "Backboard returned scores", gemini_response)
            except Exception as e:
                log(f"STAGE 4.{i}: BACKBOARD FAILED", f"Error: {str(e)}")
                import traceback
                print(traceback.format_exc())
    
    cache.set_job_data(job_id, "gemini_report", gemini_results)
    
    # ========================================================================
    # STAGE 5: Final Scoring
    # ========================================================================
    log("STAGE 5: FINALIZATION", "Computing final scores and verdicts")
    
    final_claims = []
    for i, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        evidence = evidence_results.get(claim_id, {})
        gemini = gemini_results.get(claim_id, {})
        
        log(f"STAGE 5.{i}: FINALIZE", f"Finalizing claim: {claim['claim_text']}", {
            "backboard_verdict": evidence.get("backboard_verdict"),
            "gemini_verdict": gemini.get("gemini_verdict"),
            "score_breakdown": gemini.get("score_breakdown")
        })
        
        try:
            final_breakdown = finalize_claim_score(
                gemini_response=gemini,
                backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR")
            )
            
            final_verdict = map_score_to_verdict(final_breakdown.final_score)
            
            final_claim = {
                "claim_id": claim_id,
                "claim_text": claim["claim_text"],
                "claim_type": claim["claim_type"],
                "final_verdict": final_verdict,
                "fact_score": final_breakdown.final_score,
                "breakdown": final_breakdown.model_dump(),
                "explanation": gemini.get("short_explanation", ""),
                "sources": evidence.get("sources", [])
            }
            
            final_claims.append(final_claim)
            log(f"STAGE 5.{i}: SUCCESS", "Finalized claim", final_claim)
        
        except Exception as e:
            log(f"STAGE 5.{i}: FAILED", f"Error finalizing: {str(e)}")
            import traceback
            print(traceback.format_exc())
    
    # ========================================================================
    # FINAL RESULT
    # ========================================================================
    final_result = {
        "job_id": job_id,
        "input_type": "text",
        "claims": final_claims,
        "processing_time": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    cache.set_job_data(job_id, "final_result", final_result)
    cache.set_job_status(job_id, "READY", "Test complete")
    
    log("FINAL RESULT", "Pipeline completed successfully", final_result)
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Input: {test_text}")
    print(f"Claims extracted: {len(claims)}")
    print(f"Claims finalized: {len(final_claims)}")
    print("\nResults:")
    for i, claim in enumerate(final_claims, 1):
        print(f"\n  Claim {i}: {claim['claim_text']}")
        print(f"    Verdict: {claim['final_verdict']}")
        print(f"    Score: {claim['fact_score']}/100")
        print(f"    Sources: {len(claim['sources'])}")
        if claim['sources']:
            print(f"    First source: {claim['sources'][0].get('title', 'N/A')}")
    print("="*80 + "\n")


if __name__ == "__main__":
    print("\n" + "🚀 "*20)
    print("ProofPulse Pipeline Test - Full Diagnostic")
    print("🚀 "*20 + "\n")
    
    asyncio.run(test_full_pipeline())
