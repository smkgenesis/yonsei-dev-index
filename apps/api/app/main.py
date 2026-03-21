from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.1")
    allowed_origins = [
        settings.app_web_url,
        "https://ysdevidx.com",
        "https://www.ysdevidx.com",
    ]
    if settings.app_env != "production":
        allowed_origins.append("http://localhost:3000")

    allowed_origin_hosts = {
        urlparse(origin).netloc for origin in allowed_origins if urlparse(origin).netloc
    }

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def enforce_same_origin_for_state_changes(request: Request, call_next):
        protected_methods = {"POST", "PUT", "PATCH", "DELETE"}
        if request.method in protected_methods and request.url.path.startswith("/api/v1/"):
            has_session_cookie = settings.session_cookie_name in request.cookies
            has_oauth_cookie = settings.oauth_state_cookie_name in request.cookies
            if has_session_cookie or has_oauth_cookie:
                origin = request.headers.get("origin")
                referer = request.headers.get("referer")

                candidate_host = None
                if origin:
                    candidate_host = urlparse(origin).netloc
                elif referer:
                    candidate_host = urlparse(referer).netloc

                if not candidate_host or candidate_host not in allowed_origin_hosts:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Request origin is not allowed."},
                    )

        return await call_next(request)

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
