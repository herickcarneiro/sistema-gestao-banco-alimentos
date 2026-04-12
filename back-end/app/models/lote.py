import uuid
from datetime import date

from sqlalchemy import UUID, Boolean, CheckConstraint, Column, Integer, ForeignKey, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from database.database import Base

class Lote(Base):
    __tablename__ = "lote"

    __table_args__ = (
    CheckConstraint("quantidade_disponivel >= 0", name="check_quantidade_positiva"),
    UniqueConstraint("id_produto", "data_validade", name="uq_lote_validade"),
    )

    id_lote = Column(UUID(as_uuid = True), primary_key= True, default=uuid.uuid4)
    id_produto = Column(UUID(as_uuid=True), ForeignKey("produto.id_produto"))
    quantidade_disponivel = Column(Integer, nullable=False)
    data_validade = Column(Date, nullable=False)
    data_entrada = Column(Date, nullable=False, default=date.today)
    esta_valido = Column(Boolean, nullable=False)

    produto = relationship("Produto", back_populates="lotes")
    movimentacoes_lote = relationship("MovimentacaoLote", back_populates="lote")
