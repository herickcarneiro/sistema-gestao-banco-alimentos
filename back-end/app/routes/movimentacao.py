from datetime import date, datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.local import Local
from app.models.lote import Lote
from app.models.movimentacao import Movimentacao
from app.models.movimentacao_lote import MovimentacaoLote
from app.models.usuario import Usuario
from app.models.produto import Produto
from app.schemas.movimentacao import EntradaBatchRequest, SaidaBatchRequest, MovimentacaoPublic, MovimentacaoHistoryPublic
from sqlalchemy.orm import joinedload
from core.seguranca import get_current_user
from database.database import get_db
from utils.decorators import handle_db_session

rota_movimentacao = APIRouter(prefix="/api/demand", tags=["movement"])

@rota_movimentacao.post("/movement/input", status_code=status.HTTP_201_CREATED, response_model=MovimentacaoPublic)
@handle_db_session
async def create_input(
    entrada_batch: EntradaBatchRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not entrada_batch.id_local_origem:
        raise HTTPException(400, "Origem é obrigatória")
    
    local = db.query(Local).filter(Local.id_local == entrada_batch.id_local_origem).first()
    if not local:
        raise HTTPException(400, "Local de origem não cadastrado")

    # 🔹 Filtrar a ONG dona (destino da entrada)
    ong = db.query(Local).filter(Local.is_owner == True).first()

    # 🔹 1. Criar movimentação (cabeçalho unica)
    movimentacao = Movimentacao(
        id_usuario=current_user.id_usuario,
        id_origem=entrada_batch.id_local_origem,
        tipo_movimentacao="entrada",
        id_destino=ong.id_local if ong else None,
        data_movimentacao=datetime.utcnow()
    )
    db.add(movimentacao)
    db.flush()

    # 🔹 2. Processar itens em batch
    for item in entrada_batch.itens:
        if item.quantidade <= 0:
            raise HTTPException(400, "A quantidade de todos os itens deve ser maior que zero")
        if item.data_validade < date.today():
            raise HTTPException(400, "Não é possível dar entrada em itens já vencidos")

        lote = db.query(Lote).filter(
            Lote.id_produto == item.id_produto,
            Lote.data_validade == item.data_validade
        ).with_for_update().first()

        if lote:
            lote.quantidade_disponivel += item.quantidade
        else:
            lote = Lote(
                id_produto=item.id_produto,
                quantidade_disponivel=item.quantidade,
                data_validade=item.data_validade,
                data_entrada=date.today(),
                esta_valido=True
            )
            db.add(lote)
            db.flush()

        mov_lote = MovimentacaoLote(
            id_movimentacao=movimentacao.id_movimentacao,
            id_lote=lote.id_lote,
            quantidade=item.quantidade
        )
        db.add(mov_lote)

    db.commit()
    db.refresh(movimentacao)

    return movimentacao


@rota_movimentacao.post("/movement/output", status_code=status.HTTP_201_CREATED, response_model=MovimentacaoPublic)
@handle_db_session
async def create_output(
    saida_batch: SaidaBatchRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not saida_batch.id_local_destino:
        raise HTTPException(400, "Destino é obrigatório")

    destino = db.query(Local).filter(Local.id_local == saida_batch.id_local_destino).first()
    if not destino:
        raise HTTPException(400, "Beneficiário destino não cadastrado")

    ong = db.query(Local).filter(Local.is_owner == True).first()

    # 🔹 CRIAR MOVIMENTAÇÃO (CABEÇALHO)
    movimentacao = Movimentacao(
        id_usuario=current_user.id_usuario,
        id_origem=ong.id_local if ong else None,
        id_destino=saida_batch.id_local_destino,
        tipo_movimentacao="saida",
        data_movimentacao=datetime.utcnow()
    )
    db.add(movimentacao)
    db.flush()
    
    for item in saida_batch.itens:
        if item.quantidade <= 0:
            raise HTTPException(400, "A quantidade de todos os lotes selecionados deve ser maior que zero")
            
        lote = db.query(Lote).filter(Lote.id_lote == item.id_lote).with_for_update().first()
        if not lote:
            raise HTTPException(400, f"Lote com id {item.id_lote} não encontrado no sistema")
            
        if item.quantidade > lote.quantidade_disponivel:
            raise HTTPException(400, f"Estoque insuficiente no lote {item.id_lote}.")
            
        lote.quantidade_disponivel -= item.quantidade
        
        mov_lote = MovimentacaoLote(
            id_movimentacao=movimentacao.id_movimentacao,
            id_lote=lote.id_lote,
            quantidade=item.quantidade
        )
        db.add(mov_lote)
        
    db.commit()
    db.refresh(movimentacao)
    
    return movimentacao

@rota_movimentacao.get("/movement/", response_model=List[MovimentacaoHistoryPublic])
async def get_movements_history(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    movimentacoes = db.query(Movimentacao).options(
        joinedload(Movimentacao.usuario),
        joinedload(Movimentacao.origem),
        joinedload(Movimentacao.destino),
        joinedload(Movimentacao.itens).joinedload(MovimentacaoLote.lote).joinedload(Lote.produto).joinedload(Produto.categoria)
    ).order_by(Movimentacao.data_movimentacao.desc()).limit(limit).all()

    resultado = []
    for mov in movimentacoes:
        resultado.append({
            "id_movimentacao": mov.id_movimentacao,
            "tipo_movimentacao": mov.tipo_movimentacao,
            "data_movimentacao": mov.data_movimentacao,
            "usuario_nome": mov.usuario.nome if mov.usuario else "Sistema",
            "origem_nome": mov.origem.nome_local if mov.origem else None,
            "destino_nome": mov.destino.nome_local if mov.destino else None,
            "itens": [
                {
                    "id_movimentacao_lote": item.id_movimentacao_lote,
                    "produto_nome": item.lote.produto.nome_produto,
                    "quantidade": item.quantidade,
                    "categoria_nome": item.lote.produto.categoria.nome_categoria if item.lote.produto.categoria else "Outros"
                } for item in mov.itens
            ]
        })
    return resultado
