from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

class FieldConfig(BaseModel):
    name: str
    label: str
    aggregation: Optional[str] = None
    visible: bool = True

class GraphConfig(BaseModel):
    id: str
    title: str
    type: str  # bar, line, table, donut
    xAxis: Optional[str] = None
    yAxis: Optional[List[str]] = None
    fields: List[FieldConfig] = []
    saved: bool = False

class RelatorioCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    configuracao: Dict[str, Any]

    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Relatório de Entradas",
                "descricao": "Gráfico de entradas por categoria",
                "configuracao": {
                    "graphs": [
                        {
                            "id": "1",
                            "title": "Entradas por Categoria",
                            "type": "bar",
                            "xAxis": "categoria",
                            "yAxis": ["quantidadeNumerica"],
                            "fields": [],
                        }
                    ]
                }
            }
        }

class RelatorioUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    configuracao: Optional[Dict[str, Any]] = None

class RelatorioPublic(BaseModel):
    id_relatorio: UUID
    nome: str
    descricao: Optional[str]
    configuracao: Dict[str, Any]
    data_criacao: datetime
    data_atualizacao: datetime

    class Config:
        from_attributes = True

class RelatorioList(BaseModel):
    relatorios: List[RelatorioPublic]
