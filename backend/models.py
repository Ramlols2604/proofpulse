"""Pydantic models for request/response schemas and internal data structures."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


# ============================================================================
# Request Models
# ============================================================================

class IngestRequest(BaseModel):
    """Request model for /ingest endpoint."""
    type: Literal["video", "text", "url", "pdf", "txt"]
    content: Optional[str] = None  # For text, url, or txt content
    # file will be handled separately via UploadFile


class ProcessRequest(BaseModel):
    """Request model for /process endpoint."""
    job_id: str


# ============================================================================
# Response Models
# ============================================================================

class IngestResponse(BaseModel):
    """Response from /ingest endpoint."""
    job_id: str
    status: str
    message: Optional[str] = None


class StatusResponse(BaseModel):
    """Response from /status endpoint."""
    job_id: str
    status: str
    message: Optional[str] = None


# ============================================================================
# Internal Data Models
# ============================================================================

class Timestamp(BaseModel):
    """Timestamp model for video segments."""
    start: float
    end: float
    text: str


class Source(BaseModel):
    """Evidence source model."""
    title: str
    publisher: str
    date: Optional[str] = None
    url: str
    snippet: str


class ExtractedClaim(BaseModel):
    """Claim extracted by Backboard LLM."""
    claim_id: str
    claim_text: str
    claim_type: Literal["statistical", "scientific", "policy", "historical"]
    start_time: Optional[float] = None
    end_time: Optional[float] = None


class BackboardEvidence(BaseModel):
    """Evidence from Backboard web search."""
    backboard_verdict: Literal["SUPPORTED", "CONTRADICTED", "UNCLEAR"]
    backboard_confidence: int = Field(ge=0, le=100)
    sources: list[Source]
    rationale: str


class GeminiScoreBreakdown(BaseModel):
    """Score breakdown from Gemini."""
    model_config = {"protected_namespaces": ()}
    
    evidence_strength: int = Field(ge=0, le=30)
    evidence_agreement: int = Field(ge=0, le=30)
    context_accuracy: int = Field(ge=0, le=20)
    model_confidence_points: int = Field(ge=0, le=20)


class SourceUsed(BaseModel):
    """Source reference from Gemini."""
    url: str
    why: str


class GeminiResponse(BaseModel):
    """Complete response from Gemini API."""
    gemini_verdict: Literal["SUPPORTED", "MOSTLY_SUPPORTED", "UNCLEAR", "MOSTLY_CONTRADICTED", "CONTRADICTED"]
    gemini_confidence: int = Field(ge=0, le=100)
    score_breakdown: GeminiScoreBreakdown
    short_explanation: str = Field(max_length=400)
    sources_used: list[SourceUsed]
    context_notes: Optional[str] = None


class FinalBreakdown(BaseModel):
    """Final score breakdown after backend processing."""
    model_config = {"protected_namespaces": ()}
    
    evidence_strength: int
    evidence_agreement: int
    context_accuracy: int
    model_confidence_points: int
    base_points: int
    agreement_multiplier: float
    final_score: int


class FinalClaim(BaseModel):
    """Final claim with complete analysis (verdict and explanation use Backboard + Gemini)."""
    claim_id: str
    claim_text: str
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    claim_type: str
    final_verdict: Literal["SUPPORTED", "MOSTLY_SUPPORTED", "UNCLEAR", "MOSTLY_CONTRADICTED", "CONTRADICTED"]
    fact_score: int = Field(ge=0, le=100)
    breakdown: FinalBreakdown
    explanation: str  # From Gemini short_explanation or Backboard rationale
    sources: list[Source]
    # Backboard SDK verdict/confidence from verify_claim (for transparency)
    backboard_verdict: Optional[str] = None
    backboard_confidence: Optional[int] = None


class ResultResponse(BaseModel):
    """Final result response from /result endpoint."""
    job_id: str
    input_type: str
    timestamps: Optional[list[Timestamp]] = None
    claims: list[FinalClaim]
    processing_time: Optional[float] = None
    created_at: datetime


# ============================================================================
# User Settings Models
# ============================================================================

class UserSettings(BaseModel):
    """User-specific runtime settings."""
    gemini_enabled: bool = False
    demo_mode: Literal["cached", "live"] = "cached"


class SettingsResponse(BaseModel):
    """Response from /settings endpoint."""
    gemini_enabled: bool
    demo_mode: Literal["cached", "live"]
    client_id: str


# ============================================================================
# Validators
# ============================================================================

@field_validator("backboard_confidence", "gemini_confidence")
def validate_confidence_range(cls, v):
    """Ensure confidence is between 0 and 100."""
    if not 0 <= v <= 100:
        raise ValueError("Confidence must be between 0 and 100")
    return v
