#!/usr/bin/env python3
"""Test the real live pipeline with full debug logging."""
import asyncio
import os
from datetime import datetime

# Set debug mode BEFORE importing config
os.environ["DEBUG_JOB_ID"] = "live_debug_test"

# Now import everything else
try:
    from cache import cache
except Exception:
    from cache_mock import cache
from pipeline import process_pipeline


async def main():
    """Run a test with full debug logging."""
    
    job_id = "live_debug_test"
    test_text = "The earth is flat"
    
    print(f"\n{'='*80}")
    print(f"LIVE PIPELINE TEST")
    print(f"{'='*80}")
    print(f"Job ID: {job_id}")
    print(f"Text: {test_text}")
    print(f"Time: {datetime.now()}")
    print(f"{'='*80}\n")
    
    # Initialize job
    cache.initialize_job(job_id, "text", test_text)
    cache.set_job_data(job_id, "client_id", "test-debug-client")
    
    # Run pipeline
    await process_pipeline(job_id)
    
    # Get result
    result = cache.get_job_data(job_id, "final_result")
    
    print(f"\n{'='*80}")
    print(f"FINAL RESULT")
    print(f"{'='*80}\n")
    
    import json
    print(json.dumps(result, indent=2, default=str))
    
    print(f"\n{'='*80}")
    print(f"SUMMARY")
    print(f"{'='*80}")
    if result and "claims" in result:
        for claim in result["claims"]:
            print(f"\nClaim: {claim['claim_text']}")
            print(f"Verdict: {claim['final_verdict']}")
            print(f"Score: {claim['fact_score']}/100")
            print(f"Sources: {len(claim.get('sources', []))}")
            print(f"Breakdown:")
            for key, val in claim['breakdown'].items():
                print(f"  {key}: {val}")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    asyncio.run(main())
