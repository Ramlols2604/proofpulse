"""Video text extraction using TwelveLabs API."""
from integrations.twelvelabs import upload_and_transcribe
from typing import Tuple, List, Optional


async def extract_from_video(video_path: str) -> Tuple[str, List[dict]]:
    """
    Extract text and timestamps from video file.
    
    Args:
        video_path: Path to uploaded video file
    
    Returns:
        (normalized_text, timestamps)
        - normalized_text: Full transcript as string
        - timestamps: List of timestamp dictionaries
    
    Raises:
        Exception: If video processing fails
    """
    try:
        result = await upload_and_transcribe(video_path)
        
        normalized_text = result.get("normalized_text", "")
        timestamps = result.get("timestamps", [])
        
        if not normalized_text:
            raise ValueError("Empty transcript returned from video")
        
        return normalized_text, timestamps
    
    except Exception as e:
        raise Exception(f"Video extraction failed: {str(e)}")
