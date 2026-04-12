from fastapi import FastAPI

app = FastAPI()

from .routes.autenticacao import rota_autenticacao
from .routes.usuario import rota_usuario
from .routes.categoria import rota_categoria
from .routes.produto import rota_produto
from .routes.local import rota_local
from .routes.lote import rota_lote
from .routes.estoque import rota_estoque
from .routes.movimentacao import rota_movimentacao

app.include_router(rota_autenticacao)
app.include_router(rota_usuario)
app.include_router(rota_local)
app.include_router(rota_categoria)
app.include_router(rota_produto)
app.include_router(rota_lote)
app.include_router(rota_estoque)
app.include_router(rota_movimentacao)

@app.on_event("startup")
def startup_event():
    from database.database import SessionLocal, ensure_schema_compatibility
    from app.models.categoria import Categoria

    ensure_schema_compatibility()

    db = SessionLocal()
    categorias_padrao = [
        "Grãos e Cereais",
        "Massas e Panificação",
        "Proteína Animal",
        "Óleos e Gorduras",
        "Condimentos",
        "Hortifruti",
        "Laticínios",
        "Bebidas"
    ]
    try:
        for nome_cat in categorias_padrao:
            if not db.query(Categoria).filter_by(nome_categoria=nome_cat).first():
                db.add(Categoria(nome_categoria=nome_cat))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Erro ao injetar categorias iniciais: {e}")
    finally:
        db.close()
