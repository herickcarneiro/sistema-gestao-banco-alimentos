from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, logger, status
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from app.models.categoria import Categoria
from app.models.local import Local
from app.models.lote import Lote
from app.models.movimentacao import Movimentacao
from app.models.movimentacao_lote import MovimentacaoLote
from app.models.produto import Produto
from app.models.usuario import Usuario
from app.schemas.movimentacao import EntradaCreate, EntradaPublic, SaidaCreate, SaidaResponse
from core.seguranca import get_current_user
from database.database import get_db
from utils.decorators import handle_db_session

rota_movimentacao = APIRouter(prefix="/api/demand", tags=["movement"])

@rota_movimentacao.post("/movement/input", status_code=status.HTTP_201_CREATED, response_model=EntradaPublic)
@handle_db_session
async def create_input(
    entrada_in: EntradaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # 🔹 1. Validar quantidade
    if entrada_in.quantidade <= 0:
        raise HTTPException(400, "Quantidade deve ser maior que zero")

    if entrada_in.data_validade < date.today():
        raise HTTPException(400, "Data de validade não pode estar no passado")
    
    if entrada_in.id_local_origem is None:
        raise HTTPException(400, "Origem é obrigatório")
    
    local = db.query(Local).filter(
        Local.id_local == entrada_in.id_local_origem
    ).first()

    if not local:
        raise HTTPException(400, "Local de origem não cadastrado")

    # 🔹 2. Verificar se já existe lote (produto + validade)
    lote = db.query(Lote).filter(
        Lote.id_produto == entrada_in.id_produto,
        Lote.data_validade == entrada_in.data_validade
    ).first()

    # 🔹 3. Criar ou atualizar lote
    if lote:
        lote.quantidade_disponivel += entrada_in.quantidade
    else:
        lote = Lote(
            produto_id=entrada_in.id_produto,
            quantidade_disponivel=entrada_in.quantidade,
            data_validade=entrada_in.data_validade,
            esta_valido=True
        )
        db.add(lote)
        db.flush()  # pega id do lote

    # 🔹 4. Criar movimentação (cabeçalho)
    movimentacao = Movimentacao(
        id_usuario=current_user.id_usuario,
        id_origem=entrada_in.id_local_origem,
        tipo_movimentacao = "entrada",
        id_destino = None
    )

    db.add(movimentacao)
    db.flush()

    # 🔹 5. Criar movimentacao_lote
    mov_lote = MovimentacaoLote(
        id_movimentacao=movimentacao.id_movimentacao,
        id_lote=lote.id_lote,
        quantidade=entrada_in.quantidade
    )

    db.add(mov_lote)

    # 🔹 6. Commit
    db.commit()
    db.refresh(movimentacao)

    return {
    "id_movimentacao": movimentacao.id_movimentacao,
    "tipo_movimentacao": movimentacao.tipo_movimentacao,
    "data_movimentacao": movimentacao.data_movimentacao,
    "id_usuario": movimentacao.id_usuario,
    "id_origem": movimentacao.id_origem,
    "id_destino": movimentacao.id_destino,
    "quantidade": entrada_in.quantidade,
    "id_produto": entrada_in.id_produto,
    "data_validade": entrada_in.data_validade,
    "id_lote": lote.id_lote
}

@rota_movimentacao.post("/movement/output", status_code=status.HTTP_201_CREATED, response_model=SaidaResponse)
@handle_db_session
async def create_output(
    saida_in: SaidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if saida_in.quantidade <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantidade deve ser maior que zero"
        )
    
    produto = db.query(Produto).filter(Produto.id_produto == saida_in.id_produto).first()
    produto_nome = produto.nome_produto 
    
    if not produto: raise HTTPException(400,"Produto não encontrado")

    lotes = (
        db.query(Lote)
        .filter(
            Lote.id_produto == saida_in.id_produto,
            Lote.quantidade_disponivel > 0,
            Lote.data_validade >= date.today()
        )
        .order_by(Lote.data_validade.asc())
        .with_for_update() 
        .all()
    )

    if not lotes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não há estoque disponível para este produto"
        )

    total_disponivel = sum(lote.quantidade_disponivel for lote in lotes)
    
    if saida_in.quantidade > total_disponivel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estoque insuficiente. Disponível: {total_disponivel} unidades"
        )

    # 🔹 5. CRIAR MOVIMENTAÇÃO (CABEÇALHO)
    movimentacao = Movimentacao(
        id_usuario=current_user.id_usuario,
        id_destino=saida_in.id_local_destino,
        tipo_movimentacao="saida",
        data_movimentacao=datetime.utcnow()
    )

    db.add(movimentacao)
    db.flush()

    # PROCESSAR FEFO E REGISTRAR LOTES UTILIZADOS
    restante = saida_in.quantidade
    lotes_utilizados = []
    quantidades_originais = {}  # Para armazenar quantidades antes da alteração

    for lote in lotes:
        if restante == 0:
            break

        # Guardar quantidade original para o log
        quantidades_originais[lote.id_lote] = lote.quantidade_disponivel
        
        # Calcular quanto consumir deste lote
        consumir = min(lote.quantidade_disponivel, restante)
        
        # Atualizar estoque do lote
        lote.quantidade_disponivel -= consumir
        
        # Criar item da movimentação
        mov_lote = MovimentacaoLote(
            id_movimentacao=movimentacao.id_movimentacao,
            id_lote=lote.id_lote,
            quantidade=consumir
        )
        db.add(mov_lote)
        
        # Registrar lote utilizado para resposta
        lotes_utilizados.append({
            "id_lote": lote.id_lote,
            "quantidade_utilizada": consumir,
            "quantidade_restante": lote.quantidade_disponivel,
            "data_validade": lote.data_validade,
            "produto_nome": produto_nome
        })
        
        restante -= consumir

    db.commit()
    db.refresh(movimentacao)

    return {
        "id_movimentacao": movimentacao.id_movimentacao,
        "quantidade_total": saida_in.quantidade,
        "id_produto": saida_in.id_produto,
        "produto_nome": produto_nome,
        "data_movimentacao": movimentacao.data_movimentacao,
        "lotes_utilizados": [
            {
                "id_lote": str(l["id_lote"]),
                "quantidade_utilizada": l["quantidade_utilizada"],
                "quantidade_restante": l["quantidade_restante"],
                "data_validade": l["data_validade"].isoformat(),
            }
            for l in lotes_utilizados
        ],
    }

@rota_movimentacao.get("/movimentacoes")
async def list_movements(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Retorna lista de movimentações para o dashboard"""
    movimentacoes = (
        db.query(
            Movimentacao.id_movimentacao,
            Movimentacao.tipo_movimentacao,
            Movimentacao.data_movimentacao,
            Produto.nome_produto.label("item"),
            Categoria.nome_categoria.label("categoria"),
            MovimentacaoLote.quantidade,
            Produto.unidade_medida.label("unidade"),
            Usuario.nome.label("responsavel"),
            Local.nome_local.label("local"),
            Local.nome_local.label("origem_destino"),
        )
        .join(Movimentacao, MovimentacaoLote.id_movimentacao == Movimentacao.id_movimentacao)
        .join(Lote, MovimentacaoLote.id_lote == Lote.id_lote)
        .join(Produto, Lote.id_produto == Produto.id_produto)
        .join(Categoria, Produto.id_categoria == Categoria.id_categoria)
        .join(Usuario, Movimentacao.id_usuario == Usuario.id_usuario)
        .join(
            Local,
            (Local.id_local == Movimentacao.id_origem) | (Local.id_local == Movimentacao.id_destino),
            isouter=True
        )
        .order_by(Movimentacao.data_movimentacao.desc())
        .all()
    )

    result = [
        {
            "codigo": f"MOV-{str(mov[0])[:8].upper()}",
            "item": mov[3],
            "categoria": mov[4],
            "tipo": mov[1],
            "quantidade": mov[5],
            "unidade": mov[6],
            "responsavel": mov[7],
            "local": mov[8],
            "data": mov[2].isoformat(),
            "origem_destino": mov[9],
        }
        for mov in movimentacoes
    ]

    return result