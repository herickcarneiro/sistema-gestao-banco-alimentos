import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# carrega variáveis do .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def ensure_schema_compatibility():
    inspector = inspect(engine)

    if not inspector.has_table("lote"):
        return

    lote_columns = {column["name"] for column in inspector.get_columns("lote")}

    with engine.begin() as connection:
        if "data_entrada" not in lote_columns:
            connection.execute(text("ALTER TABLE lote ADD COLUMN data_entrada DATE"))

        connection.execute(
            text("UPDATE lote SET data_entrada = data_validade WHERE data_entrada IS NULL")
        )
        connection.execute(
            text("ALTER TABLE lote ALTER COLUMN data_entrada SET DEFAULT CURRENT_DATE")
        )
        connection.execute(
            text("ALTER TABLE lote ALTER COLUMN data_entrada SET NOT NULL")
        )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
