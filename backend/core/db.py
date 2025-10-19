from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import Optional
from fastapi import Request
from sqlalchemy.orm import Session


class Database:
    def __init__(
        self,
        dbname: str,
        user: str,
        password: str,
        host: str = "localhost",
        port: str = "5432",
        dbtype: str = "postgresql",
        echo: bool = False,
    ):
        self.dbtype = dbtype
        self.dbname = dbname
        self.user = user
        self.password = password
        self.host = host
        self.port = port

        self.url = f"{self.dbtype}://{self.user}:{self.password}@{self.host}:{self.port}/{self.dbname}"

        self.engine = create_engine(self.url, echo=echo)

        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_session(self):
        return self.SessionLocal()

    def execute(self, query: str, params: Optional[dict] = None):
        with self.engine.connect() as connection:
            result = connection.execute(text(query), params or {})
            return result.fetchall()

def get_db(request: Request):

    session = request.app.state.db.get_session()
    try:
        yield session
    finally:
        session.close()