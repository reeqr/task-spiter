from fastapi import APIRouter
from app.api.v1.endpoints import auth, providers, models, concepts, terms, config, tasks, folders

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(providers.router)
api_router.include_router(models.router)
api_router.include_router(concepts.router)
api_router.include_router(terms.router)
api_router.include_router(config.router)
api_router.include_router(tasks.router)
api_router.include_router(folders.router)