from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.local import Local
from app.models.usuario import Usuario
from app.schemas.local import LocalCreate, LocalList, LocalPublic, LocalUpdate
from core.seguranca import get_current_user
from database.database import get_db
from uuid import UUID


rota_local = APIRouter(prefix="/api/demand", tags=["places"])

@rota_local.get("/places/", response_model=LocalList)
async def read_products(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    locais = db.query(Local).all()
    return {"locais":locais}

@rota_local.get("/places/{local_id}", response_model=LocalPublic)
async def get_category(
    place_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    local = db.query(Local).filter(Local.id_local == place_id).first()
    
    if not local:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local não encontrado"
        )
    
    return local

@rota_local.post("/places/", response_model=LocalPublic, status_code=status.HTTP_201_CREATED)
async def create_place(
    local_in: LocalCreate,
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    
    if local_in.cnpj_local and len(local_in.cnpj_local) != 14:
     raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="O CNPJ deve possuir 14 números."
    )
   
    if local_in.cpf_local and len(local_in.cpf_local) != 11:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O CPF deve possuir 11 números."
        )

    nome_normalizado = local_in.nome_local.strip().title()

    # verificar nome
    existe_nome = db.query(Local).filter(
        func.lower(Local.nome_local) == func.lower(nome_normalizado)
    ).first()

    if existe_nome:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Local '{nome_normalizado}' já existe"
        )

    # verificar CPF
    if local_in.cpf_local:
        existe_cpf = db.query(Local).filter(
            Local.cpf_local == local_in.cpf_local
        ).first()

        if existe_cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado"
            )

    # verificar CNPJ
    if local_in.cnpj_local:
        existe_cnpj = db.query(Local).filter(
            Local.cnpj_local == local_in.cnpj_local
        ).first()

        if existe_cnpj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CNPJ já cadastrado"
            )

    novo_local = Local(
        nome_local=nome_normalizado,
        cpf_local=local_in.cpf_local,
        cnpj_local=local_in.cnpj_local
    )

    db.add(novo_local)
    db.commit()
    db.refresh(novo_local)

    return novo_local

@rota_local.put("/places/{local_id}", response_model=LocalPublic)
async def update_local(
    place_id: UUID,
    local_in: LocalUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    local = db.query(Local).filter(Local.id_local == place_id).first()

    if not local:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local não encontrado"
        )

    update_data = local_in.model_dump(exclude_unset=True)

    if "nome_local" in update_data:
        nome_normalizado = update_data["nome_local"].strip().title()

        existe = db.query(Local).filter(
            func.lower(Local.nome_local) == func.lower(nome_normalizado),
            Local.id_local != place_id
        ).first()

        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe local com nome '{nome_normalizado}'"
            )

        local.nome_local = nome_normalizado
    
     # verificar CPF
    if local_in.cpf_local:
        existe_cpf = db.query(Local).filter(
            Local.cpf_local == local_in.cpf_local
        ).first()

        if existe_cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado"
            )

    # verificar CNPJ
    if local_in.cnpj_local:
        existe_cnpj = db.query(Local).filter(
            Local.cnpj_local == local_in.cnpj_local
        ).first()

        if existe_cnpj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CNPJ já cadastrado"
            )

    if "cpf_local" in update_data:
        local.cpf_local = update_data["cpf_local"]

    if "cnpj_local" in update_data:
        local.cnpj_local = update_data["cnpj_local"]

    db.commit()
    db.refresh(local)

    return local

@rota_local.delete("/places/{local_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_place(
    place_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)):

    local = db.query(Local).filter(Local.id_local == place_id).first()

    if not local:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local não encontrado"
        )
    
    db.delete(local)
    db.commit()
    
    return None  # Retorna 204 No Content
