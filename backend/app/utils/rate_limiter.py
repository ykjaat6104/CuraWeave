import time
import hashlib
import logging
from typing import Dict, Tuple, Optional
from collections import defaultdict
from uuid import UUID

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

logger = logging.getLogger(__name__)


class SlidingWindowCounter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: Dict[str, list] = defaultdict(list)

    def is_allowed(self, key: str) -> Tuple[bool, int]:
        now = time.time()
        window_start = now - self.window_seconds

        timestamps = self._buckets[key]
        self._buckets[key] = [t for t in timestamps if t > window_start]

        if len(self._buckets[key]) >= self.max_requests:
            reset_in = int(self.window_seconds - (now - self._buckets[key][0]))
            return False, max(1, reset_in)

        self._buckets[key].append(now)
        return True, 0


class RateLimitConfig:
    def __init__(
        self,
        public: Tuple[int, int] = (30, 60),
        authenticated: Tuple[int, int] = (600, 60),
        ai: Tuple[int, int] = (10, 60),
        payment_webhook: Tuple[int, int] = (50, 60),
    ):
        self.public_max, self.public_window = public
        self.auth_max, self.auth_window = authenticated
        self.ai_max, self.ai_window = ai
        self.payment_max, self.payment_window = payment_webhook


rate_limit_config = RateLimitConfig()

# Buckets keyed by client identifier
_public_bucket = SlidingWindowCounter(rate_limit_config.public_max, rate_limit_config.public_window)
_auth_bucket = SlidingWindowCounter(rate_limit_config.auth_max, rate_limit_config.auth_window)
_ai_bucket = SlidingWindowCounter(rate_limit_config.ai_max, rate_limit_config.ai_window)
_payment_bucket = SlidingWindowCounter(rate_limit_config.payment_max, rate_limit_config.payment_window)


def _client_key(request: Request) -> str:
    token = request.headers.get("Authorization", "")
    if token.startswith("Bearer "):
        hashed = hashlib.sha256(token.encode()).hexdigest()[:16]
        return f"token:{hashed}"
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}"


def _is_ai_route(path: str) -> bool:
    return "/ai/" in path


def _is_payment_webhook(path: str) -> bool:
    return "/billing/webhook" in path or "/webhooks/" in path


def _is_public_route(path: str) -> bool:
    public_prefixes = ("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/public/", "/health", "/")
    return any(path.startswith(p) for p in public_prefixes)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        key = _client_key(request)
        path = request.url.path

        if _is_payment_webhook(path):
            allowed, reset_in = _payment_bucket.is_allowed(key)
            bucket_name = "payment"
        elif _is_ai_route(path):
            allowed, reset_in = _ai_bucket.is_allowed(key)
            bucket_name = "ai"
        elif _is_public_route(path):
            allowed, reset_in = _public_bucket.is_allowed(key)
            bucket_name = "public"
        else:
            allowed, reset_in = _auth_bucket.is_allowed(key)
            bucket_name = "authenticated"

        if not allowed:
            logger.warning(f"Rate limit exceeded for {key} on {bucket_name} bucket")
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Try again in {reset_in} seconds.",
                        "retry_after": reset_in,
                    }
                },
                headers={"Retry-After": str(reset_in), "X-RateLimit-Bucket": bucket_name},
            )

        response = await call_next(request)
        return response
