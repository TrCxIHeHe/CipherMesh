from fastapi import APIRouter
from app.api.routes import health, classical, des, steganography

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(classical.router)
api_router.include_router(des.router)
api_router.include_router(steganography.router)

