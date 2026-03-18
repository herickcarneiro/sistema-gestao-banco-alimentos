from fastapi import APIRouter, Depends, HTTPException

from database.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UserList, UsuarioCreate, UsuarioPublic, UsuarioUpdate
from sqlalchemy.orm import Session

from core.seguranca import get_current_user, get_password_hash


rota_usuario = APIRouter(prefix="/api/core", tags=["core"])

@rota_usuario.get("/users/", response_model=UserList)
async def read_users(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    users = db.query(Usuario).all()
    return { 'users': users}

@rota_usuario.get("/users/me", response_model=UsuarioPublic)
def read_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

@rota_usuario.patch("/users/me", response_model=UsuarioPublic)
def update_me(
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):

    update_data = user_in.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="Pelo menos um campo deve ser alterado."
        )

    if user_in.email is not None and user_in.email != current_user.email:

        # verifica se o email já está em uso por outro usuário
        email_existente = db.query(Usuario).filter(
            Usuario.email == user_in.email
            ).first()

        if email_existente:
            raise HTTPException(
                status_code=400,
                detail="Email já está em uso"
            )
    else:
        raise HTTPException(
                status_code=400,
                detail="Email não foi alterado"
            )

    # hash da senha
    if "senha" in update_data:
        update_data["senha"] = get_password_hash(update_data["senha"])

    # atualiza campos dinamicamente
    for campo, valor in update_data.items():
        setattr(current_user, campo, valor)

    db.commit()
    db.refresh(current_user)

    return current_user

@rota_usuario.get("/operadores")
async def list_operadores(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Retorna lista de operadores para o dashboard"""
    usuarios = db.query(Usuario).filter(Usuario.ativo == True).all()

    result = []
    for usuario in usuarios:
        # Contar movimentações do usuário
        from app.models.movimentacao import Movimentacao
        from datetime import datetime, date
        
        total_movs = db.query(Movimentacao).filter(
            Movimentacao.id_usuario == usuario.id_usuario
        ).count()
        
        today = date.today()
        today_movs = db.query(Movimentacao).filter(
            Movimentacao.id_usuario == usuario.id_usuario,
            Movimentacao.data_movimentacao >= datetime.combine(today, datetime.min.time())
        ).count()

        result.append({
            "id": str(usuario.id_usuario),
            "nome": usuario.nome,
            "email": usuario.email,
            "funcao": "operador",  # TODO: adicionar campo funcao no modelo Usuario
            "turno": "manha",  # TODO: adicionar campo turno no modelo Usuario
            "status": "ativo" if usuario.ativo else "inativo",
            "data_admissao": usuario.data_criacao.isoformat() if usuario.data_criacao else None,
            "movimentacoes_hoje": today_movs,
            "movimentacoes_total": total_movs,
            "acuracia_nota": 9.0,  # TODO: adicionar campo acuracia no modelo Usuario
            "ultima_atividade": datetime.utcnow().isoformat(),  # TODO: adicionar campo ultima_atividade
        })

    return result