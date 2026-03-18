import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from database.database import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(UUID(as_uuid = True), primary_key= True, default=uuid.uuid4)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    movimentacoes = relationship("Movimentacao", back_populates="usuario")
    relatorios = relationship("Relatorio", back_populates="usuario")

    def id(self):
        """Alias para compatibilidade com SQLAlchemy"""
        return self.id_usuario