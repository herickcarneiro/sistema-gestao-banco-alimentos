
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException

from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.lote import Lote
from app.models.produto import Produto
from app.models.usuario import Usuario
from app.schemas.lote import LoteCreate, LoteExpired, LoteExpiredList, LoteList, LotePost, LotePublic, LoteUpdate
from core.seguranca import get_current_user
from database.database import get_db
from datetime import date

rota_lote = APIRouter(prefix="/api/demand", tags=["batches"])

@rota_lote.get("/batches/", response_model=LoteList)
async def read_batches(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    lotes = (
        db.query(Lote)
        .options(
            joinedload(Lote.produto).joinedload(Produto.categoria)
        )
        .all()
    )

    hoje = date.today()

    resultado = []

    for lote in lotes:
        dias_para_vencer = (lote.data_validade - hoje).days

        if(dias_para_vencer < 0):
            lote.esta_valido = False

        resultado.append({
            "id_lote": lote.id_lote,
            "id_produto": lote.id_produto,
            "produto": lote.produto.nome_produto,
            "categoria": lote.produto.categoria.nome_categoria,
            "quantidade_disponivel": lote.quantidade_disponivel,
            "data_validade": lote.data_validade,
            "data_entrada": lote.data_entrada,
            "dias_para_vencer": dias_para_vencer,
            "esta_valido": lote.esta_valido
        })

    return {"lotes": resultado}

@rota_lote.get("/batches/{batch_id}", response_model=LotePublic)
async def read_batch(
    batch_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    lote = (
        db.query(Lote)
        .options(
            joinedload(Lote.produto).joinedload(Produto.categoria)
        )
        .filter(Lote.id_lote == batch_id)
        .first()
    )

    if not lote:
        raise HTTPException(
            status_code=404,
            detail="Lote não encontrado"
        )

    dias_para_vencer = (lote.data_validade - date.today()).days

    return {
        "id_lote": lote.id_lote,
        "id_produto": lote.id_produto,
        "produto": lote.produto.nome_produto,
        "categoria": lote.produto.categoria.nome_categoria,
        "quantidade_disponivel": lote.quantidade_disponivel,
        "data_validade": lote.data_validade,
        "data_entrada": lote.data_entrada,
        "dias_para_vencer": dias_para_vencer,
        "esta_valido": lote.esta_valido
    }

@rota_lote.post("/batches/", response_model=LotePost, status_code=201)
async def create_batch(
    lote_in: LoteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    
    if(lote_in.data_validade < date.today()):
       raise HTTPException(
           status_code= 404,
           detail="Data de vencimento inválida."
       )

    produto = db.query(Produto).filter(
        Produto.id_produto == lote_in.id_produto
    ).first()

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    # verificar se já existe lote com mesmo produto e validade
    lote_existente = db.query(Lote).filter(
        Lote.id_produto == lote_in.id_produto,
        Lote.data_validade == lote_in.data_validade
    ).first()

    if lote_existente:
        lote_existente.quantidade_disponivel += lote_in.quantidade_disponivel

        db.commit()
        db.refresh(lote_existente)

        return lote_existente

    # criar novo lote
    esta_valido = lote_in.data_validade >= date.today()

    novo_lote = Lote(
        id_produto=lote_in.id_produto,
        quantidade_disponivel=lote_in.quantidade_disponivel,
        data_validade=lote_in.data_validade,
        data_entrada=date.today(),
        esta_valido=esta_valido
    )

    db.add(novo_lote)
    db.commit()
    db.refresh(novo_lote)

    return novo_lote

@rota_lote.get("/batches/next-due-date/list", response_model=LoteExpiredList)
async def read_batches_next_due_date(
    dias: int = 7,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    hoje = date.today()
    limite = hoje + timedelta(days=dias)

    lotes = (
        db.query(Lote)
        .options(joinedload(Lote.produto))
        .filter(
            Lote.data_validade >= hoje,
            Lote.data_validade <= limite
        )
        .all()
    )

    resultado = [
        {
            "id_lote": lote.id_lote,
            "id_produto": lote.id_produto,
            "quantidade_disponivel": lote.quantidade_disponivel,
            "data_validade": lote.data_validade,
            "produto": lote.produto.nome_produto
        }
        for lote in lotes
    ]

    return {"lotes": resultado}


@rota_lote.get("/batches/expired/list", response_model=LoteExpiredList)
async def read_bacthes_expire(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    hoje = date.today()

    lotes = (
        db.query(Lote)
        .options(joinedload(Lote.produto))
        .filter(Lote.data_validade < hoje)
        .all()
    )

    resultado = [
        {
            "id_lote": lote.id_lote,
            "id_produto": lote.id_produto,
            "produto": lote.produto.nome_produto,
            "quantidade_disponivel": lote.quantidade_disponivel,
            "data_validade": lote.data_validade,
        }
        for lote in lotes
    ]

    return {"lotes": resultado}

@rota_lote.put("/batches/{batch_id}", response_model=LotePublic)
async def update_batch(
    lote_id: UUID,
    lote_in: LoteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    lote = db.query(Lote).filter(
        Lote.id_lote == lote_id
    ).first()

    if not lote:
        raise HTTPException(
            status_code=404,
            detail="Lote não encontrado"
        )

    update_data = lote_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(lote, key, value)

    if lote.data_validade:
        lote.esta_valido = lote.data_validade >= date.today()

    db.commit()
    db.refresh(lote)

    return lote

@rota_lote.delete("/batches/{batch_id}", status_code=204)
async def delete_batch(
    lote_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    lote = db.query(Lote).filter(
        Lote.id_lote == lote_id
    ).first()

    if not lote:
        raise HTTPException(
            status_code=404,
            detail="Lote não encontrado"
        )

    db.delete(lote)
    db.commit()

    return
