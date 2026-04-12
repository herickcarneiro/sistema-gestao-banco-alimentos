from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class LocalCreate(BaseModel):
    nome_local: str
    cpf_local: str | None = None
    cnpj_local: str | None = None

class LocalPublic(BaseModel):
    id_local: UUID
    nome_local: str
    cpf_local: str | None = None
    cnpj_local: str | None = None
    is_owner: bool = False

    class Config:
        from_attributes = True

class LocalList(BaseModel):
    locais: list[LocalPublic]

class LocalUpdate(BaseModel):
    nome_local: Optional[str] = None
    cpf_local: Optional[str] = None
    cnpj_local: Optional[str] = None
