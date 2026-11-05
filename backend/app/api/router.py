from fastapi import APIRouter
from app.api.routes import health, classical

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(classical.router)

