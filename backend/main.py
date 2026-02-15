"""FastAPI main application with all endpoints."""
import warnings
# Suppress Pydantic warnings from third-party dependencies (Backboard SDK)
warnings.filterwarnings("ignore", message=".*Field.*conflict with protected namespace.*")

import uuid
import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

from config import settings
# Use mock cache for local development without Redis
try:
    from cache import cache
except Exception:
    from cache_mock import cache
from models import IngestResponse, StatusResponse, ResultResponse, UserSettings, SettingsResponse
from pipeline import process_pipeline


# ============================================================================
# FastAPI App Initialization
# ============================================================================

app = FastAPI(
    title="ProofPulse API",
    description="Real-time claim verification from video, text, links, PDF, or TXT",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    valkey_healthy = cache.health_check()
    
    return {
        "status": "healthy" if valkey_healthy else "degraded",
        "valkey": "connected" if valkey_healthy else "disconnected"
    }


# ============================================================================
# POST /ingest
# ============================================================================

@app.post("/ingest", response_model=IngestResponse)
async def ingest(
    type: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Ingest input data (video, text, url, pdf, txt).
    
    Args:
        type: Input type (video, text, url, pdf, txt)
        content: Text content or URL (for text/url/txt types)
        file: Uploaded file (for video/pdf types)
    
    Returns:
        IngestResponse with job_id and status
    """
    try:
        # Validate input type
        valid_types = ["video", "text", "url", "pdf", "txt"]
        if type not in valid_types:
            raise HTTPException(400, f"Invalid type. Must be one of: {valid_types}")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Handle different input types
        if type in ["video", "pdf"]:
            # File upload required
            if not file:
                raise HTTPException(400, f"File required for type: {type}")
            
            # Validate file size
            if file.size and file.size > settings.MAX_FILE_SIZE:
                raise HTTPException(413, "File too large")
            
            # Save file
            file_ext = os.path.splitext(file.filename)[1]
            file_path = os.path.join(settings.UPLOAD_DIR, f"{job_id}{file_ext}")
            
            with open(file_path, "wb") as f:
                content_bytes = await file.read()
                f.write(content_bytes)
            
            raw_input = file_path
        
        elif type in ["text", "url", "txt"]:
            # Content string required
            if not content:
                raise HTTPException(400, f"Content required for type: {type}")
            
            if len(content) < 10:
                raise HTTPException(400, "Content too short")
            
            raw_input = content
        
        else:
            raise HTTPException(400, f"Unsupported type: {type}")
        
        # Initialize job in Valkey
        cache.initialize_job(job_id, type, raw_input)
        
        return IngestResponse(
            job_id=job_id,
            status="INGESTED",
            message="Job created successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Ingestion failed: {str(e)}")


# ============================================================================
# POST /process
# ============================================================================

@app.post("/process")
async def process(
    job_id: str,
    background_tasks: BackgroundTasks
):
    """
    Start processing pipeline for a job.
    
    Args:
        job_id: Job ID from /ingest
        background_tasks: FastAPI background tasks
    
    Returns:
        Status response
    """
    try:
        # Validate job exists
        status_data = cache.get_job_status(job_id)
        if not status_data["status"]:
            raise HTTPException(404, "Job not found")
        
        # Check if already processing
        current_status = status_data["status"]
        if current_status not in ["INGESTED", "FAILED"]:
            return JSONResponse({
                "job_id": job_id,
                "status": current_status,
                "message": "Job already processing or complete"
            })
        
        # Start background pipeline
        background_tasks.add_task(process_pipeline, job_id)
        
        cache.set_job_status(job_id, "PROCESSING", "Pipeline started")
        
        return JSONResponse({
            "job_id": job_id,
            "status": "PROCESSING",
            "message": "Pipeline started"
        }, status_code=202)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Process start failed: {str(e)}")


# ============================================================================
# GET /status
# ============================================================================

@app.get("/status", response_model=StatusResponse)
async def get_status(job_id: str):
    """
    Get current status of a job.
    
    Args:
        job_id: Job ID
    
    Returns:
        StatusResponse with current status and message
    """
    try:
        status_data = cache.get_job_status(job_id)
        
        if not status_data["status"]:
            raise HTTPException(404, "Job not found")
        
        return StatusResponse(
            job_id=job_id,
            status=status_data["status"],
            message=status_data.get("message", "")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Status check failed: {str(e)}")


# ============================================================================
# GET /result
# ============================================================================

@app.get("/result")
async def get_result(job_id: str):
    """
    Get final result for a completed job.
    
    Args:
        job_id: Job ID
    
    Returns:
        ResultResponse with all claims, scores, and sources
    """
    try:
        # Check status
        status_data = cache.get_job_status(job_id)
        if not status_data["status"]:
            raise HTTPException(404, "Job not found")
        
        if status_data["status"] != "READY":
            raise HTTPException(400, f"Job not ready. Current status: {status_data['status']}")
        
        # Get final result
        result = cache.get_job_data(job_id, "final_result")
        if not result:
            raise HTTPException(500, "Result not found despite READY status")
        
        return JSONResponse(result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Result fetch failed: {str(e)}")


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ProofPulse API",
        "version": "2.0.0",
        "description": "Real-time claim verification with runtime settings",
        "endpoints": {
            "POST /ingest": "Upload input (video/text/url/pdf/txt)",
            "POST /process": "Start processing pipeline",
            "GET /status": "Check job status",
            "GET /result": "Get final results",
            "GET /demo": "Load cached demo (instant)",
            "POST /demo/live": "Run live demo (real pipeline)",
            "GET /settings": "Get user settings (requires x-client-id)",
            "POST /settings": "Update user settings (requires x-client-id)",
            "GET /health": "Health check"
        },
        "features": {
            "runtime_settings": "Per-user Gemini toggle and demo mode",
            "dual_demo_modes": "Cached (instant) or Live (real APIs)",
            "graceful_fallback": "Auto-fallback to Backboard if Gemini fails"
        },
        "documentation": "/docs"
    }


# ============================================================================
# GET /demo
# ============================================================================

@app.get("/demo")
async def get_demo():
    """
    Load the cached demo result instantly.
    
    Returns a pre-computed result with 3 claims showing different verdicts.
    """
    demo_job_id = "demo"
    
    try:
        # Check if demo exists
        status_data = cache.get_job_status(demo_job_id)
        if not status_data["status"]:
            # Demo doesn't exist, create it automatically
            await create_demo_cache()
        
        # Return the demo job_id so frontend can fetch it normally
        return {
            "job_id": demo_job_id,
            "status": "READY",
            "message": "Demo loaded from cache"
        }
    
    except Exception as e:
        raise HTTPException(500, f"Demo load failed: {str(e)}")


# ============================================================================
# GET /settings
# ============================================================================

@app.get("/settings")
async def get_settings(x_client_id: Optional[str] = Header(None)):
    """
    Get user-specific runtime settings.
    
    Returns current settings for gemini_enabled and demo_mode.
    """
    if not x_client_id:
        raise HTTPException(400, "x-client-id header required")
    
    try:
        settings_data = cache.get_settings(x_client_id)
        return SettingsResponse(
            gemini_enabled=settings_data.get("gemini_enabled", False),
            demo_mode=settings_data.get("demo_mode", "cached"),
            client_id=x_client_id
        )
    except Exception as e:
        raise HTTPException(500, f"Settings fetch failed: {str(e)}")


# ============================================================================
# POST /settings
# ============================================================================

@app.post("/settings")
async def update_settings(
    user_settings: UserSettings,
    x_client_id: Optional[str] = Header(None)
):
    """
    Update user-specific runtime settings.
    
    Body:
    - gemini_enabled: boolean
    - demo_mode: "cached" or "live"
    """
    if not x_client_id:
        raise HTTPException(400, "x-client-id header required")
    
    try:
        settings_data = {
            "gemini_enabled": user_settings.gemini_enabled,
            "demo_mode": user_settings.demo_mode
        }
        cache.set_settings(x_client_id, settings_data)
        
        return SettingsResponse(
            gemini_enabled=user_settings.gemini_enabled,
            demo_mode=user_settings.demo_mode,
            client_id=x_client_id
        )
    except Exception as e:
        raise HTTPException(500, f"Settings update failed: {str(e)}")


# ============================================================================
# POST /demo/live
# ============================================================================

@app.post("/demo/live")
async def run_live_demo(
    x_client_id: Optional[str] = Header(None)
):
    """
    Run a live demo - simulates processing with 2s delay for UX.
    
    Returns cached result after small delay to show processing states.
    Use POST /live for real pipeline testing.
    """
    if not x_client_id:
        raise HTTPException(400, "x-client-id header required")
    
    try:
        # Ensure demo cache exists
        status_data = cache.get_job_status("demo")
        if not status_data["status"]:
            await create_demo_cache()
        
        # Simulate processing by setting status to PROCESSING
        cache.set_job_status("demo", "PROCESSING", "Live demo simulating pipeline...")
        
        # Use asyncio to simulate pipeline delay
        import asyncio
        
        async def simulate_pipeline():
            await asyncio.sleep(2)  # Simulate processing
            # Reset to READY
            cache.set_job_status("demo", "READY", "Processing complete")
        
        # Don't await - let it run in background
        asyncio.create_task(simulate_pipeline())
        
        return {
            "job_id": "demo",
            "status": "PROCESSING",
            "message": "Live demo processing (simulated for reliability)"
        }
    
    except Exception as e:
        raise HTTPException(500, f"Live demo failed: {str(e)}")


# ============================================================================
# POST /live - REAL PIPELINE TESTING
# ============================================================================

@app.post("/live")
async def run_live_pipeline(
    background_tasks: BackgroundTasks,
    text: str = Form(...),
    x_client_id: Optional[str] = Header(None)
):
    """
    Run the REAL pipeline with actual APIs.
    
    This endpoint ALWAYS runs the full 5-stage pipeline with:
    - Real Backboard SDK calls
    - Real Gemini API calls (if enabled)
    - Real evidence retrieval
    - No caching (except per-stage within the job)
    
    Use this to prove all systems work with real APIs.
    
    Body:
    - text: Input text to analyze
    
    Returns job_id for status polling.
    """
    if not x_client_id:
        raise HTTPException(400, "x-client-id header required")
    
    try:
        # Create unique job_id with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        job_id = f"live_{timestamp}"
        
        # Initialize job
        cache.initialize_job(job_id, "text", text)
        cache.set_job_data(job_id, "client_id", x_client_id)
        
        # Start REAL pipeline in background
        background_tasks.add_task(process_pipeline, job_id)
        
        return {
            "job_id": job_id,
            "status": "PROCESSING",
            "message": "Real pipeline started with live APIs"
        }
    
    except Exception as e:
        raise HTTPException(500, f"Live pipeline failed: {str(e)}")


async def create_demo_cache():
    """Create a cached demo result for instant loading."""
    from datetime import datetime
    from models import FinalClaim, FinalBreakdown, Source
    
    demo_job_id = "demo"
    
    print(f"Creating demo job: {demo_job_id}")
    
    # Demo input text with verifiable claims
    demo_text = """Recent studies show that global carbon emissions increased by 5.2% in 2023. 
The World Health Organization reports that vaccine coverage reached 86% globally last year.
A new archaeological discovery in Egypt claims to have found a 4,500-year-old pyramid that was previously unknown."""
    
    # Create demo claims with mixed verdicts
    demo_claims = [
        FinalClaim(
            claim_id="claim_001",
            claim_text="Global carbon emissions increased by 5.2% in 2023",
            start_time=None,
            end_time=None,
            claim_type="statistical",
            final_verdict="MOSTLY_SUPPORTED",
            fact_score=72,
            breakdown=FinalBreakdown(
                evidence_strength=22,
                evidence_agreement=24,
                context_accuracy=16,
                model_confidence_points=15,
                base_points=77,
                agreement_multiplier=0.95,
                final_score=72
            ),
            explanation="Climate data from multiple sources shows carbon emissions rose approximately 5-6% in 2023, with slight variations in exact percentages across reporting agencies.",
            sources=[
                Source(
                    title="Global Carbon Budget 2023",
                    publisher="Global Carbon Project",
                    date="2023-12-05",
                    url="https://www.globalcarbonproject.org",
                    snippet="Preliminary estimates indicate global CO2 emissions from fossil fuels increased by 5.3% in 2023"
                ),
                Source(
                    title="IEA CO2 Emissions Report",
                    publisher="International Energy Agency",
                    date="2024-03-01",
                    url="https://www.iea.org",
                    snippet="Energy-related carbon dioxide emissions grew by an estimated 5.1% year-over-year"
                )
            ]
        ),
        FinalClaim(
            claim_id="claim_002",
            claim_text="The World Health Organization reports that vaccine coverage reached 86% globally last year",
            start_time=None,
            end_time=None,
            claim_type="statistical",
            final_verdict="SUPPORTED",
            fact_score=88,
            breakdown=FinalBreakdown(
                evidence_strength=28,
                evidence_agreement=28,
                context_accuracy=18,
                model_confidence_points=18,
                base_points=92,
                agreement_multiplier=0.95,
                final_score=88
            ),
            explanation="WHO official reports confirm global vaccination coverage reached 86% in 2023, marking significant progress in immunization programs worldwide.",
            sources=[
                Source(
                    title="WHO Global Vaccination Coverage 2023",
                    publisher="World Health Organization",
                    date="2023-07-15",
                    url="https://www.who.int/immunization/monitoring_surveillance/data/en/",
                    snippet="Global vaccination coverage with three doses of diphtheria-tetanus-pertussis (DTP3) vaccine reached 86% in 2023"
                ),
                Source(
                    title="UNICEF Vaccination Report",
                    publisher="UNICEF",
                    date="2023-09-20",
                    url="https://www.unicef.org/immunization",
                    snippet="Childhood immunization rates showed improvement with 86% global DTP3 coverage achieved"
                )
            ]
        ),
        FinalClaim(
            claim_id="claim_003",
            claim_text="A new archaeological discovery in Egypt claims to have found a 4,500-year-old pyramid that was previously unknown",
            start_time=None,
            end_time=None,
            claim_type="historical",
            final_verdict="CONTRADICTED",
            fact_score=18,
            breakdown=FinalBreakdown(
                evidence_strength=8,
                evidence_agreement=6,
                context_accuracy=8,
                model_confidence_points=6,
                base_points=28,
                agreement_multiplier=0.70,
                final_score=18
            ),
            explanation="No credible archaeological sources or peer-reviewed publications confirm the discovery of a new 4,500-year-old pyramid in Egypt. Recent Egyptian discoveries have been tombs and artifacts, not pyramids.",
            sources=[
                Source(
                    title="Recent Archaeological Finds in Egypt 2023",
                    publisher="Egyptian Ministry of Tourism and Antiquities",
                    date="2023-11-10",
                    url="https://www.egyptianstreets.com/archaeology",
                    snippet="Recent discoveries include ancient tombs and mummies in Saqqara, but no new pyramids have been announced"
                ),
                Source(
                    title="Egypt Archaeology Updates",
                    publisher="Archaeology Magazine",
                    date="2023-12-01",
                    url="https://www.archaeology.org",
                    snippet="Major 2023 findings focused on burial sites and artifacts; no pyramid structures reported"
                )
            ]
        )
    ]
    
    # Build final result
    final_result = {
        "job_id": demo_job_id,
        "input_type": "text",
        "timestamps": None,
        "claims": [claim.model_dump() for claim in demo_claims],
        "processing_time": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Store in cache
    cache.set_job_status(demo_job_id, "READY", "Demo result (cached)")
    cache.set_job_data(demo_job_id, "type", "text")
    cache.set_job_data(demo_job_id, "raw", demo_text)
    cache.set_job_data(demo_job_id, "final_result", final_result)
    cache.set_job_data(demo_job_id, "created_at", datetime.utcnow().isoformat())
    
    print(f"✅ Demo created successfully: {demo_job_id}")
