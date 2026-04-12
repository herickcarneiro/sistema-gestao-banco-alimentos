from pydantic import BaseModel
from uuid import UUID
from datetime import date

class LoteBase(BaseModel):
    id_produto: UUID
    quantidade_disponivel: int
    data_validade: date

class LotePost(LoteBase):
    id_lote: UUID
    data_entrada: date

class LoteCreate(LoteBase):
    pass

class LoteUpdate(BaseModel):
    quantidade_disponivel: int | None = None
    data_validade: date | None = None

class LotePublic(LoteBase):
    id_lote: UUID
    data_entrada: date
    produto: str
    categoria: str
    dias_para_vencer: int
    esta_valido: bool

    class Config:
        from_attributes = True

class LoteExpired(BaseModel):
    id_lote: UUID
    id_produto: UUID
    produto: str
    quantidade_disponivel: int
    data_validade: date

class LoteExpiredList(BaseModel):
    lotes: list[LoteExpired]

class LoteList(BaseModel):
    lotes: list[LotePublic]
