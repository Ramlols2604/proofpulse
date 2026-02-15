"""Valkey (Redis-compatible) cache wrapper for job data management."""
import redis
import json
from typing import Any, Optional
from datetime import datetime
from config import settings


class ValkeyCache:
    """Valkey cache client for storing and retrieving job data."""
    
    def __init__(self):
        """Initialize Redis connection pool."""
        try:
            self.client = redis.from_url(
                settings.VALKEY_URL,
                decode_responses=True,
                encoding="utf-8",
                socket_connect_timeout=1
            )
            # Test connection
            self.client.ping()
        except (redis.ConnectionError, redis.TimeoutError):
            print("⚠️  Redis/Valkey not available, using mock cache")
            # Import and use mock cache instead
            from cache_mock import MockCache
            mock = MockCache()
            # Replace all methods with mock methods
            self.__dict__.update(mock.__dict__)
            self.__class__ = mock.__class__
    
    # ========================================================================
    # Job Status Management
    # ========================================================================
    
    def set_job_status(self, job_id: str, status: str, message: str = "") -> None:
        """Set job status and optional message."""
        pipeline = self.client.pipeline()
        pipeline.set(f"job:{job_id}:status", status, ex=settings.VALKEY_TTL)
        if message:
            pipeline.set(f"job:{job_id}:message", message, ex=settings.VALKEY_TTL)
        pipeline.execute()
    
    def get_job_status(self, job_id: str) -> dict:
        """Get job status and message."""
        pipeline = self.client.pipeline()
        pipeline.get(f"job:{job_id}:status")
        pipeline.get(f"job:{job_id}:message")
        status, message = pipeline.execute()
        
        return {
            "status": status,
            "message": message or ""
        }
    
    # ========================================================================
    # Job Data Management
    # ========================================================================
    
    def set_job_data(self, job_id: str, key: str, value: Any) -> None:
        """Store job data as JSON."""
        data = json.dumps(value) if not isinstance(value, str) else value
        self.client.set(f"job:{job_id}:{key}", data, ex=settings.VALKEY_TTL)
    
    def get_job_data(self, job_id: str, key: str) -> Optional[Any]:
        """Retrieve job data and parse JSON if applicable."""
        data = self.client.get(f"job:{job_id}:{key}")
        if data is None:
            return None
        
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data
    
    def cache_exists(self, job_id: str, key: str) -> bool:
        """Check if a cache key exists."""
        return self.client.exists(f"job:{job_id}:{key}") > 0
    
    # ========================================================================
    # Bulk Operations
    # ========================================================================
    
    def set_multiple(self, job_id: str, data: dict) -> None:
        """Set multiple job data fields at once."""
        pipeline = self.client.pipeline()
        for key, value in data.items():
            serialized = json.dumps(value) if not isinstance(value, str) else value
            pipeline.set(f"job:{job_id}:{key}", serialized, ex=settings.VALKEY_TTL)
        pipeline.execute()
    
    def get_multiple(self, job_id: str, keys: list[str]) -> dict:
        """Get multiple job data fields at once."""
        pipeline = self.client.pipeline()
        for key in keys:
            pipeline.get(f"job:{job_id}:{key}")
        
        results = pipeline.execute()
        output = {}
        
        for key, data in zip(keys, results):
            if data is None:
                output[key] = None
            else:
                try:
                    output[key] = json.loads(data)
                except (json.JSONDecodeError, TypeError):
                    output[key] = data
        
        return output
    
    # ========================================================================
    # Job Initialization
    # ========================================================================
    
    def initialize_job(self, job_id: str, input_type: str, raw_input: str) -> None:
        """Initialize a new job with metadata."""
        data = {
            "type": input_type,
            "raw": raw_input,
            "created_at": datetime.utcnow().isoformat()
        }
        self.set_multiple(job_id, data)
        self.set_job_status(job_id, "INGESTED", "Job created successfully")
    
    # ========================================================================
    # Cleanup
    # ========================================================================
    
    def delete_job(self, job_id: str) -> None:
        """Delete all keys associated with a job."""
        keys = self.client.keys(f"job:{job_id}:*")
        if keys:
            self.client.delete(*keys)
    
    def health_check(self) -> bool:
        """Check if Valkey connection is healthy."""
        try:
            self.client.ping()
            return True
        except redis.ConnectionError:
            return False
    
    # ========================================================================
    # User Settings
    # ========================================================================
    
    def get_settings(self, client_id: str) -> dict:
        """Get user settings by client_id."""
        key = f"settings:{client_id}"
        data = self.client.get(key)
        if data is None:
            # Return defaults
            return {
                "gemini_enabled": False,
                "demo_mode": "cached"
            }
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return {
                "gemini_enabled": False,
                "demo_mode": "cached"
            }
    
    def set_settings(self, client_id: str, settings: dict) -> None:
        """Set user settings by client_id."""
        key = f"settings:{client_id}"
        self.client.set(key, json.dumps(settings))
        self.client.expire(key, self.ttl * 24)  # Settings last longer (24 hours)


# Global cache instance
cache = ValkeyCache()
