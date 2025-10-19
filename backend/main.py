import uvicorn
from core.config import settings
from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.llm import LLM
from api.router import router 
from core.db import Database
from models import Base
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.llm = LLM(
        provider = settings.LLM_PROVIDER,
        api_key=settings.GOOGLE_API_KEY,
        model_name=settings.MODEL_NAME,
    )

    app.state.db = Database(
        dbtype=settings.DB_TYPE,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        echo = True
    )

    
    Base.metadata.create_all(bind=app.state.db.engine) 
    
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.RELOAD)
