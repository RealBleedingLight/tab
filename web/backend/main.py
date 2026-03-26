from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from web.backend.config import ALLOWED_ORIGINS


def create_app() -> FastAPI:
    app = FastAPI(title="Guitar Teacher API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from web.backend.routers import theory, songs, upload
    app.include_router(theory.router, prefix="/theory")
    app.include_router(songs.router, prefix="/songs")
    app.include_router(upload.router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
