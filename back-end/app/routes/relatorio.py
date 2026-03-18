from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from app.models.usuario import Usuario
from app.models.relatorio import Relatorio
from app.schemas.relatorio import RelatorioCreate, RelatorioUpdate, RelatorioPublic, RelatorioList
from core.seguranca import get_current_user
from uuid import UUID

rota_relatorio = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

@rota_relatorio.post("", status_code=status.HTTP_201_CREATED, response_model=RelatorioPublic)
async def create_relatorio(
    relatorio_in: RelatorioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Criar novo relatório"""
    relatorio = Relatorio(
        id_usuario=current_user.id_usuario,
        nome=relatorio_in.nome,
        descricao=relatorio_in.descricao,
        configuracao=relatorio_in.configuracao
    )
    
    db.add(relatorio)
    db.commit()
    db.refresh(relatorio)
    
    return relatorio

@rota_relatorio.get("", response_model=RelatorioList)
async def list_relatorios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar relatórios do usuário"""
    relatorios = db.query(Relatorio).filter(
        Relatorio.id_usuario == current_user.id_usuario
    ).all()
    
    return {"relatorios": relatorios}

@rota_relatorio.get("/{relatorio_id}", response_model=RelatorioPublic)
async def get_relatorio(
    relatorio_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obter um relatório específico"""
    relatorio = db.query(Relatorio).filter(
        Relatorio.id_relatorio == relatorio_id,
        Relatorio.id_usuario == current_user.id_usuario
    ).first()
    
    if not relatorio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )
    
    return relatorio

@rota_relatorio.patch("/{relatorio_id}", response_model=RelatorioPublic)
async def update_relatorio(
    relatorio_id: UUID,
    relatorio_in: RelatorioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Atualizar um relatório"""
    relatorio = db.query(Relatorio).filter(
        Relatorio.id_relatorio == relatorio_id,
        Relatorio.id_usuario == current_user.id_usuario
    ).first()
    
    if not relatorio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )
    
    update_data = relatorio_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(relatorio, field, value)
    
    db.commit()
    db.refresh(relatorio)
    
    return relatorio

@rota_relatorio.delete("/{relatorio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relatorio(
    relatorio_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Deletar um relatório"""
    relatorio = db.query(Relatorio).filter(
        Relatorio.id_relatorio == relatorio_id,
        Relatorio.id_usuario == current_user.id_usuario
    ).first()
    
    if not relatorio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório não encontrado"
        )
    
    db.delete(relatorio)
    db.commit()
    
    return None
