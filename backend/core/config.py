from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()  

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = False
    GOOGLE_API_KEY: str 
    MODEL_NAME: str = "gemini-2.5-flash-lite"
    LLM_PROVIDER: str = "google"

    DB_TYPE: str = "postgresql+psycopg2"
    DB_NAME: str = "postgres"
    DB_HOST: str = "localhost"
    DB_USER: str = "postgres"
    DB_PASSWORD: str 
    DB_PORT: int = 5432

    class Config:
        env_file = ".env"

settings = Settings()

