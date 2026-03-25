"""FastAPI application factory."""
import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from guitar_teacher.api.auth import check_pin, create_token
from guitar_teacher.api.deps import require_auth


class LoginRequest(BaseModel):
    pin: str


def create_app() -> FastAPI:
    app = FastAPI(title="Guitar Teacher API", version="0.1.0")

    # CORS
    origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Public routes ---

    @app.get("/health")
    def health():
        return {"status": "ok", "version": "0.1.0"}

    @app.post("/auth/login")
    def login(req: LoginRequest):
        from fastapi.responses import JSONResponse
        if not check_pin(req.pin):
            return JSONResponse(status_code=401, content={"detail": "Invalid pin"})
        token = create_token()
        response = JSONResponse(content={"token": token})
        response.set_cookie(
            key="token", value=token, httponly=True,
            max_age=86400, samesite="none", secure=True,
        )
        return response

    @app.get("/auth/verify")
    def verify(payload=Depends(require_auth)):
        return {"status": "valid"}

    # --- Routers ---
    from guitar_teacher.api.routers.theory import router as theory_router
    app.include_router(theory_router)

    from guitar_teacher.api.routers.songs import router as songs_router
    app.include_router(songs_router)

    from guitar_teacher.api.routers.queue import router as queue_router
    app.include_router(queue_router)

    return app


def start():
    """Entry point for `guitar-teacher-api` command."""
    import uvicorn
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
