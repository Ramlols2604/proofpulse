"""Pipeline orchestration for processing jobs through 5 stages."""
import asyncio
import traceback
import time
from datetime import datetime
from typing import Optional
import uuid

# Use mock cache for local development without Redis
try:
    from cache import cache
except Exception:
    from cache_mock import cache
from models import (
    ExtractedClaim, BackboardEvidence, GeminiResponse,
    FinalClaim, FinalBreakdown, Source, Timestamp
)
from scoring import finalize_claim_score, map_score_to_verdict
from integrations.backboard import extract_claims, verify_claim, score_claim_backboard_fallback
from integrations.gemini import review_and_score_claim
from config import settings
from extractors.video import extract_from_video
from extractors.url import extract_from_url
from extractors.pdf import extract_from_pdf
from extractors.text import extract_from_text


def debug_log(job_id: str, stage: str, message: str, data: dict = None):
    """Log debug messages if DEBUG_JOB_ID matches."""
    if settings.DEBUG_JOB_ID and settings.DEBUG_JOB_ID == job_id:
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"\n{'='*80}")
        print(f"[{timestamp}] [{job_id}] {stage}")
        print(f"{'='*80}")
        print(message)
        if data:
            import json
            print(json.dumps(data, indent=2, default=str))
        print(f"{'='*80}\n")


async def process_pipeline(job_id: str) -> None:
    """
    Main async pipeline worker that processes a job through all 5 stages.
    
    Stages:
    1. EXTRACTING_TEXT - Extract text from input
    2. CLAIM_EXTRACTION - Extract claims from text
    3. EVIDENCE_RETRIEVAL - Verify each claim
    4. GEMINI_REVIEW - Score each claim
    5. SCORING - Finalize scores and build result
    
    Args:
        job_id: Unique job identifier
    """
    try:
        cache.set_job_status(job_id, "PROCESSING", "Pipeline started")
        
        # ====================================================================
        # STAGE 1: EXTRACTING_TEXT
        # ====================================================================
        await stage_1_extract_text(job_id)
        
        # ====================================================================
        # STAGE 2: CLAIM_EXTRACTION
        # ====================================================================
        await stage_2_claim_extraction(job_id)
        
        # Check if stage 2 completed early (no claims found)
        status_data = cache.get_job_status(job_id)
        if status_data.get("status") == "READY":
            print(f"[{job_id}] Pipeline completed early - no claims to process")
            return
        
        # ====================================================================
        # STAGE 3: EVIDENCE_RETRIEVAL
        # ====================================================================
        await stage_3_evidence_retrieval(job_id)
        
        # ====================================================================
        # STAGE 4: GEMINI_REVIEW
        # ====================================================================
        await stage_4_gemini_review(job_id)
        
        # ====================================================================
        # STAGE 5: SCORING
        # ====================================================================
        await stage_5_finalize_scoring(job_id)
        
        cache.set_job_status(job_id, "READY", "Processing complete")
    
    except Exception as e:
        error_msg = f"Pipeline failed: {str(e)}\n{traceback.format_exc()}"
        cache.set_job_status(job_id, "FAILED", error_msg)
        print(f"ERROR in job {job_id}: {error_msg}")


# ============================================================================
# STAGE 1: Extract Text
# ============================================================================

async def stage_1_extract_text(job_id: str) -> None:
    """Extract text from input based on type."""
    start_time = time.time()
    cache.set_job_status(job_id, "EXTRACTING_TEXT", "Stage 1/5: Parsing text content...")
    debug_log(job_id, "STAGE 1 START", "Beginning text extraction")
    
    # Check cache first
    if cache.cache_exists(job_id, "text"):
        cached_text = cache.get_job_data(job_id, "text")
        debug_log(job_id, "STAGE 1 CACHE HIT", f"Using cached text", {"text": cached_text, "length": len(cached_text)})
        print(f"[{job_id}] Stage 1: Using cached text")
        return
    
    # Get input type and raw pointer
    input_type = cache.get_job_data(job_id, "type")
    raw_input = cache.get_job_data(job_id, "raw")
    debug_log(job_id, "STAGE 1 INPUT", "Read from Valkey", {"type": input_type, "raw": raw_input[:100] if raw_input else None})
    
    # Route to appropriate extractor
    if input_type == "video":
        print(f"[{job_id}] Stage 1: Processing VIDEO input: {raw_input}")
        normalized_text, timestamps = await extract_from_video(raw_input)
        print(f"[{job_id}] Stage 1: VIDEO extracted {len(normalized_text)} chars, {len(timestamps)} timestamps")
        print(f"[{job_id}] Stage 1: VIDEO transcript preview: {normalized_text[:300]}...")
    elif input_type == "url":
        print(f"[{job_id}] Stage 1: Processing URL input: {raw_input}")
        normalized_text, timestamps = await extract_from_url(raw_input)
        print(f"[{job_id}] Stage 1: URL extracted {len(normalized_text)} chars")
    elif input_type == "pdf":
        print(f"[{job_id}] Stage 1: Processing PDF input: {raw_input}")
        normalized_text, timestamps = await extract_from_pdf(raw_input)
        print(f"[{job_id}] Stage 1: PDF extracted {len(normalized_text)} chars")
    elif input_type in ["text", "txt"]:
        print(f"[{job_id}] Stage 1: Processing TEXT input")
        normalized_text, timestamps = await extract_from_text(raw_input)
        print(f"[{job_id}] Stage 1: TEXT extracted {len(normalized_text)} chars")
    else:
        raise ValueError(f"Unsupported input type: {input_type}")
    
    # Store results
    cache.set_job_data(job_id, "text", normalized_text)
    cache.set_job_data(job_id, "timestamps", timestamps)
    cache.set_job_status(job_id, "TEXT_READY", f"Extracted {len(normalized_text)} characters")
    
    elapsed = time.time() - start_time
    debug_log(job_id, "STAGE 1 END", f"Text extracted in {elapsed:.2f}s", {
        "input_type": input_type,
        "text_preview": normalized_text[:200],
        "length": len(normalized_text),
        "timestamps_count": len(timestamps),
        "written_to_cache": ["text", "timestamps"]
    })
    print(f"[{job_id}] Stage 1: ✅ Extracted {len(normalized_text)} chars from {input_type.upper()}")
    
    # Additional validation for video
    if input_type == "video" and len(normalized_text) < 50:
        print(f"[{job_id}] ⚠️  WARNING: Video transcript seems too short ({len(normalized_text)} chars)")
        print(f"[{job_id}] Transcript content: '{normalized_text}'")


# ============================================================================
# STAGE 2: Claim Extraction
# ============================================================================

async def stage_2_claim_extraction(job_id: str) -> None:
    """Extract claims from normalized text."""
    start_time = time.time()
    cache.set_job_status(job_id, "CLAIM_EXTRACTION", "Stage 2/5: Extracting claims...")
    debug_log(job_id, "STAGE 2 START", "Beginning claim extraction")
    
    # Check cache
    if cache.cache_exists(job_id, "claims"):
        cached_claims = cache.get_job_data(job_id, "claims")
        debug_log(job_id, "STAGE 2 CACHE HIT", f"Using cached claims", {"claims_count": len(cached_claims)})
        print(f"[{job_id}] Stage 2: Using cached claims")
        return
    
    # Get normalized text
    normalized_text = cache.get_job_data(job_id, "text")
    debug_log(job_id, "STAGE 2 INPUT", "Read text from Valkey", {"text_length": len(normalized_text)})
    
    # Call Backboard to extract claims
    debug_log(job_id, "STAGE 2 API CALL", "Calling Backboard extract_claims()")
    claims_raw = await extract_claims(normalized_text)
    debug_log(job_id, "STAGE 2 API RESPONSE", "Backboard returned claims", {"claims_count": len(claims_raw), "claims": claims_raw})
    
    # Handle empty claims gracefully
    if not claims_raw or len(claims_raw) == 0:
        debug_log(job_id, "STAGE 2 NO CLAIMS", "⚠️ No claims extracted from text")
        # Create empty claims list and skip to finalization
        cache.set_job_data(job_id, "claims", [])
        cache.set_job_data(job_id, "evidence", {})
        cache.set_job_data(job_id, "gemini_report", {})
        
        # Create empty final result
        data = cache.get_multiple(job_id, ["type", "created_at", "timestamps"])
        final_result = {
            "job_id": job_id,
            "input_type": data.get("type"),
            "timestamps": data.get("timestamps", []),
            "claims": [],
            "processing_time": None,
            "created_at": data.get("created_at")
        }
        cache.set_job_data(job_id, "final_result", final_result)
        cache.set_job_status(job_id, "READY", "No factual claims found in input")
        print(f"[{job_id}] Stage 2: No claims extracted - job completed with empty result")
        return
    
    # Limit to max claims
    claims_raw = claims_raw[:settings.MAX_CLAIMS]
    
    cache.set_job_data(job_id, "claims", claims_raw)
    cache.set_job_status(job_id, "CLAIMS_READY", f"Extracted {len(claims_raw)} claims")
    
    elapsed = time.time() - start_time
    debug_log(job_id, "STAGE 2 END", f"Claims extracted in {elapsed:.2f}s", {
        "claims_count": len(claims_raw),
        "written_to_cache": "claims"
    })
    print(f"[{job_id}] Stage 2: Extracted {len(claims_raw)} claims")


# ============================================================================
# STAGE 3: Evidence Retrieval
# ============================================================================

async def stage_3_evidence_retrieval(job_id: str) -> None:
    """Retrieve evidence for each claim using Backboard web search."""
    start_time = time.time()
    cache.set_job_status(job_id, "EVIDENCE_RETRIEVAL", "Stage 3/5: Retrieving evidence...")
    debug_log(job_id, "STAGE 3 START", "Beginning evidence retrieval")
    
    # Get claims
    claims = cache.get_job_data(job_id, "claims")
    debug_log(job_id, "STAGE 3 INPUT", "Read claims from Valkey", {"claims_count": len(claims)})
    
    evidence_results = {}
    
    for idx, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        claim_text = claim["claim_text"]
        
        # Check if already cached
        if cache.cache_exists(job_id, f"evidence:{claim_id}"):
            evidence_results[claim_id] = cache.get_job_data(job_id, f"evidence:{claim_id}")
            debug_log(job_id, f"STAGE 3.{idx} CACHE HIT", f"Using cached evidence for claim {claim_id}")
            continue
        
        # Call Backboard web search
        debug_log(job_id, f"STAGE 3.{idx} API CALL", f"Calling Backboard verify_claim()", {"claim_text": claim_text})
        evidence = await verify_claim(claim_text)
        debug_log(job_id, f"STAGE 3.{idx} API RESPONSE", "Backboard returned evidence", {
            "verdict": evidence.get("backboard_verdict"),
            "confidence": evidence.get("backboard_confidence"),
            "sources_count": len(evidence.get("sources", [])),
            "sources": evidence.get("sources", [])
        })
        
        # Guard: If no sources returned, mark as UNCLEAR with low scores
        if not evidence.get("sources") or len(evidence.get("sources", [])) == 0:
            debug_log(job_id, f"STAGE 3.{idx} NO SOURCES", "⚠️ No sources returned, applying fallback")
            evidence = {
                "backboard_verdict": "UNCLEAR",
                "backboard_confidence": 10,
                "sources": [{
                    "title": "No sources found",
                    "publisher": "System",
                    "date": "2024-01-01",
                    "url": "https://example.com",
                    "snippet": "No sources returned by retrieval"
                }],
                "rationale": "No sources available for verification"
            }
        
        # Store per-claim evidence
        cache.set_job_data(job_id, f"evidence:{claim_id}", evidence)
        evidence_results[claim_id] = evidence
    
    cache.set_job_data(job_id, "evidence", evidence_results)
    cache.set_job_status(job_id, "EVIDENCE_READY", f"Retrieved evidence for {len(claims)} claims")
    
    elapsed = time.time() - start_time
    debug_log(job_id, "STAGE 3 END", f"Evidence retrieved in {elapsed:.2f}s", {
        "claims_processed": len(claims),
        "evidence_count": len(evidence_results),
        "written_to_cache": f"evidence (+ evidence:{claim_id} for each)"
    })
    print(f"[{job_id}] Stage 3: Retrieved evidence for {len(claims)} claims")


# ============================================================================
# STAGE 4: Gemini Review and Scoring
# ============================================================================

async def stage_4_gemini_review(job_id: str) -> None:
    """Get Gemini rubric scores for each claim (or Backboard fallback if disabled)."""
    
    # Get client_id and their settings
    client_id = cache.get_job_data(job_id, "client_id")
    user_settings = cache.get_settings(client_id) if client_id else {}
    gemini_enabled = user_settings.get("gemini_enabled", settings.GEMINI_ENABLED)
    
    # Check if Gemini is enabled for this user
    if not gemini_enabled:
        cache.set_job_status(job_id, "GEMINI_REVIEW", "Stage 4/5: Scoring claims...")
        print(f"[{job_id}] Stage 4: Gemini disabled for user, using Backboard fallback")
        await stage_4_backboard_fallback_scoring(job_id)
        return
    
    cache.set_job_status(job_id, "GEMINI_REVIEW", "Stage 4/5: Scoring claims...")
    
    # Get data
    normalized_text = cache.get_job_data(job_id, "text")
    claims = cache.get_job_data(job_id, "claims")
    evidence_results = cache.get_job_data(job_id, "evidence")
    
    gemini_results = {}
    
    for claim in claims:
        claim_id = claim["claim_id"]
        
        # Check cache
        if cache.cache_exists(job_id, f"gemini:{claim_id}"):
            gemini_results[claim_id] = cache.get_job_data(job_id, f"gemini:{claim_id}")
            continue
        
        # Get evidence for this claim
        evidence = evidence_results.get(claim_id, {})
        
        # Extract context snippet (first 500 chars for now)
        context_snippet = normalized_text[:500]
        
        # Call Gemini (with fallback on failure)
        try:
            gemini_response = await review_and_score_claim(
                claim_text=claim["claim_text"],
                context_text=context_snippet,
                backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                backboard_confidence=evidence.get("backboard_confidence", 50),
                sources=evidence.get("sources", [])
            )
            
            # Check if Gemini returned an error/fallback response
            if "API error" in gemini_response.get("short_explanation", ""):
                # Gemini failed, use Backboard fallback
                print(f"[{job_id}] Gemini failed for claim {claim_id}, using Backboard fallback")
                gemini_response = await score_claim_backboard_fallback(
                    claim_text=claim["claim_text"],
                    backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                    backboard_confidence=evidence.get("backboard_confidence", 50),
                    sources=evidence.get("sources", [])
                )
            
            # Store per-claim Gemini result
            cache.set_job_data(job_id, f"gemini:{claim_id}", gemini_response)
            gemini_results[claim_id] = gemini_response
        
        except Exception as e:
            # On any Gemini error, fall back to Backboard
            print(f"[{job_id}] Gemini exception for claim {claim_id}: {str(e)}, using Backboard fallback")
            gemini_response = await score_claim_backboard_fallback(
                claim_text=claim["claim_text"],
                backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
                backboard_confidence=evidence.get("backboard_confidence", 50),
                sources=evidence.get("sources", [])
            )
            cache.set_job_data(job_id, f"gemini:{claim_id}", gemini_response)
            gemini_results[claim_id] = gemini_response
    
    cache.set_job_data(job_id, "gemini_report", gemini_results)
    cache.set_job_status(job_id, "GEMINI_READY", f"Gemini scored {len(claims)} claims")
    
    print(f"[{job_id}] Stage 4: Gemini scored {len(claims)} claims")


async def stage_4_backboard_fallback_scoring(job_id: str) -> None:
    """Use Backboard to generate rubric scores when Gemini is disabled."""
    start_time = time.time()
    debug_log(job_id, "STAGE 4 BACKBOARD START", "Using Backboard fallback scoring")
    
    # Get data
    claims = cache.get_job_data(job_id, "claims")
    evidence_results = cache.get_job_data(job_id, "evidence")
    
    gemini_results = {}
    
    for idx, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        
        # Check cache
        if cache.cache_exists(job_id, f"gemini:{claim_id}"):
            gemini_results[claim_id] = cache.get_job_data(job_id, f"gemini:{claim_id}")
            continue
        
        # Get evidence for this claim
        evidence = evidence_results.get(claim_id, {})
        
        # Use Backboard to generate rubric scores
        debug_log(job_id, f"STAGE 4.{idx} BACKBOARD CALL", "Calling score_claim_backboard_fallback()", {
            "claim_text": claim["claim_text"],
            "backboard_verdict": evidence.get("backboard_verdict"),
            "sources_count": len(evidence.get("sources", []))
        })
        
        backboard_score_response = await score_claim_backboard_fallback(
            claim_text=claim["claim_text"],
            backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR"),
            backboard_confidence=evidence.get("backboard_confidence", 50),
            sources=evidence.get("sources", [])
        )
        
        debug_log(job_id, f"STAGE 4.{idx} BACKBOARD RESPONSE", "Scores received", backboard_score_response)
        
        # Store per-claim result
        cache.set_job_data(job_id, f"gemini:{claim_id}", backboard_score_response)
        gemini_results[claim_id] = backboard_score_response
    
    cache.set_job_data(job_id, "gemini_report", gemini_results)
    cache.set_job_status(job_id, "GEMINI_READY", f"Backboard scored {len(claims)} claims (Gemini disabled)")
    
    elapsed = time.time() - start_time
    debug_log(job_id, "STAGE 4 BACKBOARD END", f"Backboard scoring completed in {elapsed:.2f}s", {
        "claims_scored": len(gemini_results),
        "written_to_cache": "gemini_report"
    })
    print(f"[{job_id}] Stage 4: Backboard fallback scored {len(claims)} claims")


# ============================================================================
# STAGE 5: Finalize Scoring
# ============================================================================

async def stage_5_finalize_scoring(job_id: str) -> None:
    """Apply backend scoring logic and build final result."""
    start_time = time.time()
    cache.set_job_status(job_id, "SCORING", "Stage 5/5: Generating report...")
    debug_log(job_id, "STAGE 5 START", "Beginning final scoring")
    
    # Get all data
    data = cache.get_multiple(job_id, [
        "type", "created_at", "timestamps",
        "claims", "evidence", "gemini_report"
    ])
    
    debug_log(job_id, "STAGE 5 INPUT", "Read all data from Valkey", {
        "keys_read": list(data.keys()),
        "claims_count": len(data.get("claims", []))
    })
    
    claims = data["claims"]
    evidence_results = data["evidence"]
    gemini_results = data["gemini_report"]
    
    final_claims = []
    
    for idx, claim in enumerate(claims, 1):
        claim_id = claim["claim_id"]
        
        # Get evidence and gemini results
        evidence = evidence_results.get(claim_id, {})
        gemini = gemini_results.get(claim_id, {})
        
        debug_log(job_id, f"STAGE 5.{idx} PROCESSING", f"Finalizing claim {claim_id}", {
            "claim_text": claim["claim_text"],
            "backboard_verdict": evidence.get("backboard_verdict"),
            "gemini_scores": gemini.get("score_breakdown")
        })
        
        # Finalize score using backend logic
        try:
            final_breakdown = finalize_claim_score(
                gemini_response=gemini,
                backboard_verdict=evidence.get("backboard_verdict", "UNCLEAR")
            )
            
            # CRITICAL: Final verdict MUST come from score mapping, not from verdict fields
            final_verdict = map_score_to_verdict(final_breakdown.final_score)
            
            debug_log(job_id, f"STAGE 5.{idx} SCORING", "Backend scoring complete", {
                "base_points": final_breakdown.base_points,
                "multiplier": final_breakdown.agreement_multiplier,
                "final_score": final_breakdown.final_score,
                "final_verdict": final_verdict
            })
            
            final_claim = FinalClaim(
                claim_id=claim_id,
                claim_text=claim["claim_text"],
                start_time=claim.get("start_time"),
                end_time=claim.get("end_time"),
                claim_type=claim["claim_type"],
                final_verdict=final_verdict,  # From score mapping ONLY
                fact_score=final_breakdown.final_score,
                breakdown=final_breakdown,
                explanation=gemini.get("short_explanation", ""),
                sources=[Source(**s) for s in evidence.get("sources", [])]
            )
            
            debug_log(job_id, f"STAGE 5.{idx} SUCCESS", "Claim finalized", {
                "claim_text": claim["claim_text"],
                "final_verdict": final_verdict,
                "fact_score": final_breakdown.final_score,
                "sources_count": len(evidence.get("sources", []))
            })
            
            final_claims.append(final_claim.model_dump())
        
        except Exception as e:
            print(f"Error finalizing claim {claim_id}: {str(e)}")
            continue
    
    # Build final result
    final_result = {
        "job_id": job_id,
        "input_type": data["type"],
        "timestamps": data.get("timestamps"),
        "claims": final_claims,
        "processing_time": None,  # TODO: Calculate if needed
        "created_at": data.get("created_at", datetime.utcnow().isoformat())
    }
    
    # Store final result
    cache.set_job_data(job_id, "final_result", final_result)
    cache.set_job_status(job_id, "READY", f"Finalized {len(final_claims)} claims")
    
    elapsed = time.time() - start_time
    debug_log(job_id, "STAGE 5 END", f"Finalization complete in {elapsed:.2f}s", {
        "final_claims_count": len(final_claims),
        "written_to_cache": "final_result"
    })
    print(f"[{job_id}] Stage 5: Finalized {len(final_claims)} claims")
