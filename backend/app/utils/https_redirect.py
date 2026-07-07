from fastapi import Request
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if settings.ENFORCE_HTTPS and settings.ENVIRONMENT == "production":
            forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
            if forwarded_proto.lower() != "https":
                url = str(request.url).replace("http://", "https://", 1)
                return RedirectResponse(url=url, status_code=301)
        return await call_next(request)
