import time
from datetime import datetime
from collections import deque
from threading import Lock
from typing import List, Dict, Literal
from dataclasses import dataclass, asdict

EventType = Literal["info", "warning", "error", "success"]

@dataclass
class LogEvent:
    id: str
    timestamp: float # Unix timestamp
    type: EventType
    message: str

class SystemLogger:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SystemLogger, cls).__new__(cls)
                    cls._instance.events = deque(maxlen=100) # Keep last 100 events
                    cls._instance.id_counter = 0
        return cls._instance

    def log(self, type: EventType, message: str):
        with self._lock:
            self.id_counter += 1
            event = LogEvent(
                id=str(self.id_counter),
                timestamp=time.time() * 1000, # MS for JS compatibility
                type=type,
                message=message
            )
            self.events.appendleft(event) # Newest first
            print(f"[LOG-{type.upper()}] {message}")

    def info(self, message: str):
        self.log("info", message)

    def warning(self, message: str):
        self.log("warning", message)

    def error(self, message: str):
        self.log("error", message)

    def success(self, message: str):
        self.log("success", message)

    def get_logs(self, limit: int = 50) -> List[Dict]:
        with self._lock:
            # return list(self.events)[:limit] 
            # deque to list preserves order (newest first because we used appendleft)
            return [asdict(e) for e in list(self.events)[:limit]]

# Global instance
logger = SystemLogger()
