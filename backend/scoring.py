"""Backend scoring logic - validation and final adjustment only.

Gemini generates rubric scores, backend applies deterministic rules.
"""
from models import GeminiScoreBreakdown, FinalBreakdown


def validate_gemini_scores(score_breakdown: GeminiScoreBreakdown) -> bool:
    """
    Validate all score fields are in valid ranges.
    
    Returns True if valid, False otherwise.
    """
    if not (0 <= score_breakdown.evidence_strength <= 30):
        return False
    if not (0 <= score_breakdown.evidence_agreement <= 30):
        return False
    if not (0 <= score_breakdown.context_accuracy <= 20):
        return False
    if not (0 <= score_breakdown.model_confidence_points <= 20):
        return False
    return True


def calculate_agreement_multiplier(
    backboard_verdict: str,
    gemini_verdict: str
) -> float:
    """
    Determine multiplier based on verdict agreement.
    
    Rules:
    - Both agree (same verdict): 1.0
    - One is UNCLEAR, other is SUPPORTED/CONTRADICTED: 0.85
    - One is SUPPORTED, other is CONTRADICTED: 0.70
    """
    # Normalize verdicts to compare
    backboard = backboard_verdict.upper()
    gemini = gemini_verdict.upper()
    
    # Exact agreement
    if backboard == gemini:
        return 1.0
    
    # One is unclear, other is not
    if backboard == "UNCLEAR" or gemini == "UNCLEAR":
        return 0.85
    
    # MOSTLY_SUPPORTED and SUPPORTED are considered similar
    supported_variants = {"SUPPORTED", "MOSTLY_SUPPORTED"}
    contradicted_variants = {"CONTRADICTED", "MOSTLY_CONTRADICTED"}
    
    backboard_is_supported = backboard in supported_variants
    gemini_is_supported = gemini in supported_variants
    backboard_is_contradicted = backboard in contradicted_variants
    gemini_is_contradicted = gemini in contradicted_variants
    
    # Both generally support or both generally contradict
    if (backboard_is_supported and gemini_is_supported) or \
       (backboard_is_contradicted and gemini_is_contradicted):
        return 0.95  # Close agreement
    
    # Complete disagreement (support vs contradict)
    if (backboard_is_supported and gemini_is_contradicted) or \
       (backboard_is_contradicted and gemini_is_supported):
        return 0.70
    
    # Default for any other edge cases
    return 0.85


def compute_final_score(
    score_breakdown: GeminiScoreBreakdown,
    backboard_verdict: str,
    gemini_verdict: str
) -> tuple[int, float, int]:
    """
    Backend computes final score using Gemini's rubric scores.
    
    Steps:
    1. Sum base_points from Gemini scores
    2. Calculate agreement multiplier
    3. Apply multiplier to get final score
    
    Returns: (base_points, multiplier, final_score)
    """
    # Step 1: Sum base points from Gemini
    base_points = (
        score_breakdown.evidence_strength +
        score_breakdown.evidence_agreement +
        score_breakdown.context_accuracy +
        score_breakdown.model_confidence_points
    )
    
    # Step 2: Calculate agreement multiplier
    multiplier = calculate_agreement_multiplier(backboard_verdict, gemini_verdict)
    
    # Step 3: Apply multiplier
    final_score = round(base_points * multiplier)
    
    # Ensure final score is within bounds
    final_score = max(0, min(100, final_score))
    
    return base_points, multiplier, final_score


def map_score_to_verdict(score: int) -> str:
    """
    Map final score to verdict label.
    
    Score ranges:
    - 80-100: SUPPORTED
    - 60-79:  MOSTLY_SUPPORTED
    - 40-59:  UNCLEAR
    - 20-39:  MOSTLY_CONTRADICTED
    - 0-19:   CONTRADICTED
    """
    if score >= 80:
        return "SUPPORTED"
    elif score >= 60:
        return "MOSTLY_SUPPORTED"
    elif score >= 40:
        return "UNCLEAR"
    elif score >= 20:
        return "MOSTLY_CONTRADICTED"
    else:
        return "CONTRADICTED"


def finalize_claim_score(
    gemini_response: dict,
    backboard_verdict: str
) -> FinalBreakdown:
    """
    Complete scoring pipeline for a single claim.
    
    Takes Gemini's score breakdown and Backboard verdict,
    returns final breakdown with score and verdict.
    """
    # Extract Gemini score breakdown
    score_breakdown = GeminiScoreBreakdown(**gemini_response["score_breakdown"])
    gemini_verdict = gemini_response["gemini_verdict"]
    
    # Validate scores
    if not validate_gemini_scores(score_breakdown):
        raise ValueError("Gemini scores out of valid range")
    
    # Compute final score
    base_points, multiplier, final_score = compute_final_score(
        score_breakdown,
        backboard_verdict,
        gemini_verdict
    )
    
    # Create final breakdown
    return FinalBreakdown(
        evidence_strength=score_breakdown.evidence_strength,
        evidence_agreement=score_breakdown.evidence_agreement,
        context_accuracy=score_breakdown.context_accuracy,
        model_confidence_points=score_breakdown.model_confidence_points,
        base_points=base_points,
        agreement_multiplier=multiplier,
        final_score=final_score
    )
