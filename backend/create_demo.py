"""Create a cached demo result for instant loading."""
import asyncio
import sys
from datetime import datetime

# Import cache
try:
    from cache import cache
except:
    from cache_mock import cache

from models import FinalClaim, FinalBreakdown, Source


async def create_demo():
    """Create a demo job with pre-computed results."""
    
    demo_job_id = "demo_2024"
    
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
    
    print(f"✅ Demo created successfully!")
    print(f"   Job ID: {demo_job_id}")
    print(f"   Claims: {len(demo_claims)}")
    print(f"   - SUPPORTED: 1")
    print(f"   - MOSTLY_SUPPORTED: 1")
    print(f"   - CONTRADICTED: 1")
    print(f"\nDemo is now cached and ready to load instantly.")
    
    return demo_job_id


if __name__ == "__main__":
    asyncio.run(create_demo())
