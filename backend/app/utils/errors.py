import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


ERROR_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
}


def build_error_response(
    status_code: int,
    message: str,
    details: Optional[Any] = None,
    code: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "error": {
            "code": code or ERROR_CODES.get(status_code, "UNKNOWN"),
            "message": message,
            "details": details,
            "status_code": status_code,
        }
    }


def register_error_handlers(app: FastAPI):
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(
                status_code=exc.status_code,
                message=str(exc.detail) if exc.detail else ERROR_CODES.get(exc.status_code, "Error"),
            ),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            field = " -> ".join(str(loc) for loc in err.get("loc", []))
            errors.append({
                "field": field,
                "message": err.get("msg", "Validation error"),
                "type": err.get("type", ""),
            })
        return JSONResponse(
            status_code=422,
            content=build_error_response(
                status_code=422,
                message="Request validation failed",
                details=errors,
            ),
        )

    @app.exception_handler(HTTPException)
    async def custom_http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(
                status_code=exc.status_code,
                message=str(exc.detail),
            ),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=build_error_response(
                status_code=500,
                message="An internal error occurred. Please try again later.",
            ),
        )
