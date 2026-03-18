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
from .routes.relatorio import rota_relatorio

app.include_router(rota_autenticacao)
app.include_router(rota_usuario)
app.include_router(rota_local)
app.include_router(rota_categoria)
app.include_router(rota_produto)
app.include_router(rota_lote)
app.include_router(rota_estoque)
app.include_router(rota_movimentacao)
app.include_router(rota_relatorio)