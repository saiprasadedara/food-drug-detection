import logging
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.config import settings
from app.services.document_ai_service import document_ai_service
from app.services.firebase_service import firebase_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("docuextract-ai")

app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise-grade AI Document Text Extraction Platform powered by Google Cloud Document AI & Firebase.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.cors_origins_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Upload. Extract. Understand.",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }


@app.get("/api/health", tags=["General"])
async def health_check():
    """
    Health check endpoint returning system status and service readiness.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {
            "firebase_admin": "connected" if firebase_service.is_configured else "fallback_mode",
            "document_ai": "active" if document_ai_service.is_available() else "fallback_mode",
        },
        "limits": {
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        }
    }


# Include all API v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected internal server error occurred.",
            "error": str(exc) if settings.DEBUG else "Internal Server Error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
