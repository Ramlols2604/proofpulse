"""Mock cache for local development without Redis/Valkey."""
import json
from typing import Any, Optional
from datetime import datetime


class MockCache:
    """In-memory cache for development without Redis."""
    
    def __init__(self):
        self.store = {}
    
    def set_job_status(self, job_id: str, status: str, message: str = "") -> None:
        self.store[f"job:{job_id}:status"] = status
        if message:
            self.store[f"job:{job_id}:message"] = message
    
    def get_job_status(self, job_id: str) -> dict:
        status = self.store.get(f"job:{job_id}:status")
        message = self.store.get(f"job:{job_id}:message", "")
        return {"status": status, "message": message}
    
    def set_job_data(self, job_id: str, key: str, value: Any) -> None:
        data = json.dumps(value) if not isinstance(value, str) else value
        self.store[f"job:{job_id}:{key}"] = data
    
    def get_job_data(self, job_id: str, key: str) -> Optional[Any]:
        data = self.store.get(f"job:{job_id}:{key}")
        if data is None:
            return None
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data
    
    def cache_exists(self, job_id: str, key: str) -> bool:
        return f"job:{job_id}:{key}" in self.store
    
    def set_multiple(self, job_id: str, data: dict) -> None:
        for key, value in data.items():
            serialized = json.dumps(value) if not isinstance(value, str) else value
            self.store[f"job:{job_id}:{key}"] = serialized
    
    def get_multiple(self, job_id: str, keys: list[str]) -> dict:
        output = {}
        for key in keys:
            data = self.store.get(f"job:{job_id}:{key}")
            if data is None:
                output[key] = None
            else:
                try:
                    output[key] = json.loads(data)
                except (json.JSONDecodeError, TypeError):
                    output[key] = data
        return output
    
    def initialize_job(self, job_id: str, input_type: str, raw_input: str) -> None:
        data = {
            "type": input_type,
            "raw": raw_input,
            "created_at": datetime.utcnow().isoformat()
        }
        self.set_multiple(job_id, data)
        self.set_job_status(job_id, "INGESTED", "Job created successfully")
    
    def delete_job(self, job_id: str) -> None:
        keys_to_delete = [k for k in self.store.keys() if k.startswith(f"job:{job_id}:")]
        for key in keys_to_delete:
            del self.store[key]
    
    def health_check(self) -> bool:
        return True
    
    def get_settings(self, client_id: str) -> dict:
        """Get user settings by client_id."""
        key = f"settings:{client_id}"
        data = self.store.get(key)
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
        self.store[key] = json.dumps(settings)


# Global mock cache instance
cache = MockCache()
