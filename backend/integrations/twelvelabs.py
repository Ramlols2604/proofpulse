"""TwelveLabs API integration for video transcription and analysis.

Documentation: https://docs.twelvelabs.io/sdk-reference/python/
Uses client.indexes, client.tasks, and client.indexes.videos (SDK 1.x).
"""
import asyncio
from twelvelabs import TwelveLabs
from config import settings
from typing import Optional
import time

# SDK 1.x: indexes.create(index_name=..., models=[IndexesCreateRequestModelsItem(...)])
try:
    from twelvelabs.indexes import IndexesCreateRequestModelsItem
except ImportError:
    try:
        from twelvelabs.indexes.types import IndexesCreateRequestModelsItem
    except ImportError:
        IndexesCreateRequestModelsItem = None


async def upload_and_transcribe(video_path: str) -> dict:
    """
    Upload video to TwelveLabs and get transcript with timestamps.

    Args:
        video_path: Path to the uploaded video file

    Returns:
        {
            "normalized_text": str,
            "timestamps": [{"start": float, "end": float, "text": str}, ...]
        }
    """
    try:
        client = TwelveLabs(api_key=settings.TWELVELABS_API_KEY)
        if not settings.TWELVELABS_API_KEY:
            raise ValueError("TWELVELABS_API_KEY is not set")

        print(f"[TwelveLabs] Starting video upload: {video_path}")

        # Step 1: Create or get index (SDK uses indexes, not index)
        index_name = "proofpulse-videos"
        index = None

        def list_indexes():
            # client.indexes.list() may return a pager or list
            raw = client.indexes.list()
            if hasattr(raw, "data"):
                return raw.data or []
            if hasattr(raw, "items"):
                return list(raw.items) if raw.items else []
            return list(raw) if raw else []

        indexes = await asyncio.get_event_loop().run_in_executor(None, list_indexes)
        for idx in indexes:
            name = getattr(idx, "name", None) or getattr(idx, "index_name", None)
            if name == index_name:
                index = idx
                break

        if not index:
            print(f"[TwelveLabs] Creating new index: {index_name}")

            def create_index():
                if IndexesCreateRequestModelsItem is not None:
                    return client.indexes.create(
                        index_name=index_name,
                        models=[
                            IndexesCreateRequestModelsItem(
                                model_name="pegasus1.2",
                                model_options=["visual", "audio"],
                            )
                        ],
                    )
                raise ValueError(
                    "TwelveLabs SDK index create requires IndexesCreateRequestModelsItem. "
                    "Install/upgrade: pip install twelvelabs>=1.0"
                )

            index = await asyncio.get_event_loop().run_in_executor(None, create_index)
            print(f"[TwelveLabs] Index created with ID: {index.id}")
        else:
            print(f"[TwelveLabs] Using existing index: {index.id}")

        # Step 2: Upload video (SDK uses tasks.create with video_file or video_url)
        print(f"[TwelveLabs] Uploading video to index {index.id}")

        def create_task():
            with open(video_path, "rb") as f:
                return client.tasks.create(index_id=index.id, video_file=f)

        task = await asyncio.get_event_loop().run_in_executor(None, create_task)
        print(f"[TwelveLabs] Upload task created: {task.id}")

        # Step 3: Wait for indexing (use SDK wait_for_done if available, else poll)
        def wait_task():
            if hasattr(client.tasks, "wait_for_done"):
                return client.tasks.wait_for_done(task_id=task.id, sleep_interval=5.0)
            # Manual poll
            for _ in range(60):
                t = client.tasks.retrieve(task_id=task.id)
                if t.status == "ready":
                    return t
                if t.status == "failed":
                    raise RuntimeError(f"Indexing failed: {t.status}")
                time.sleep(5)
            raise TimeoutError("Video indexing timed out")

        task_status = await asyncio.get_event_loop().run_in_executor(None, wait_task)
        video_id = task_status.video_id
        print(f"[TwelveLabs] Video indexed successfully: {video_id}")

        # Step 4: Retrieve video with transcription (SDK: indexes.videos.retrieve)
        print(f"[TwelveLabs] Fetching transcript for video {video_id}")

        def get_video():
            return client.indexes.videos.retrieve(
                index_id=index.id,
                video_id=video_id,
                transcription=True,
            )

        video = await asyncio.get_event_loop().run_in_executor(None, get_video)

        # Step 5: Format transcript (SDK segments use .start, .end, .value)
        normalized_text = ""
        timestamps = []

        if hasattr(video, "transcription") and video.transcription:
            segments = list(video.transcription) if video.transcription else []
            print(f"[TwelveLabs] Segments found: {len(segments)}")

            for segment in segments:
                text = getattr(segment, "value", None) or getattr(segment, "text", None)
                if isinstance(segment, dict):
                    text = segment.get("value") or segment.get("text")
                start = getattr(segment, "start", 0.0) or (segment.get("start", 0.0) if isinstance(segment, dict) else 0.0)
                end = getattr(segment, "end", 0.0) or (segment.get("end", 0.0) if isinstance(segment, dict) else 0.0)
                if text:
                    normalized_text += text + " "
                    timestamps.append({"start": start, "end": end, "text": text})

        normalized_text = normalized_text.strip()
        print(f"[TwelveLabs] Final transcript length: {len(normalized_text)} chars")
        print(f"[TwelveLabs] Transcript preview: {normalized_text[:200]}...")
        
        if not normalized_text:
            raise ValueError("No transcript generated from video - transcription was empty or malformed")
        
        print(f"[TwelveLabs] ✅ Transcript extracted successfully: {len(timestamps)} segments, {len(normalized_text)} chars")
        
        return {
            "normalized_text": normalized_text,
            "timestamps": timestamps
        }
    
    except Exception as e:
        error_msg = str(e)
        print(f"[TwelveLabs] Error: {error_msg}")
        
        # For demo purposes, return a helpful error message instead of crashing
        return {
            "normalized_text": f"Video transcription failed: {error_msg}. Please check your TwelveLabs API key and ensure the video file is valid.",
            "timestamps": [
                {
                    "start": 0.0,
                    "end": 1.0,
                    "text": f"[ERROR] Video transcription unavailable: {error_msg}"
                }
            ]
        }


async def get_video_metadata(video_id: str) -> dict:
    """
    Get video metadata from TwelveLabs.
    
    TODO: Implement metadata retrieval if needed for additional context.
    
    Args:
        video_id: TwelveLabs video ID
    
    Returns:
        Video metadata dictionary
    """
    # TODO: Implement actual API call
    return {
        "duration": 120.0,
        "format": "mp4",
        "resolution": "1920x1080"
    }


# ============================================================================
# Helper Functions
# ============================================================================

def format_timestamp_segments(raw_segments: list) -> list[dict]:
    """
    Format TwelveLabs timestamp segments into standardized format.
    
    TODO: Adjust this based on actual TwelveLabs response format.
    """
    formatted = []
    for segment in raw_segments:
        formatted.append({
            "start": segment.get("start_time", 0.0),
            "end": segment.get("end_time", 0.0),
            "text": segment.get("text", "")
        })
    return formatted
