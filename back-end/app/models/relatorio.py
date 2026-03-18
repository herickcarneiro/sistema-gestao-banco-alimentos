import uuid
from sqlalchemy import UUID, Column, String, JSON, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.database import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID

class Relatorio(Base):
    __tablename__ = "relatorio"

    id_relatorio = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(PostgresUUID(as_uuid=True), ForeignKey("usuario.id_usuario"), nullable=False)
    nome = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    configuracao = Column(JSON, nullable=False)  # Stores graph configuration
    data_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    usuario = relationship("Usuario", back_populates="relatorios")

    def __repr__(self):
        return f"<Relatorio {self.nome}>"
