import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class Model(Base):
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    model_code = Column(String(100), nullable=False)
    display_name = Column(String(200), default="")
    max_tokens = Column(Integer, default=65536)
    temperature = Column(Numeric(3, 2), default=0.10)
    supports_thinking = Column(Boolean, default=False)
    thinking_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="models")
    provider = relationship("Provider", back_populates="models")


class CurrentModel(Base):
    __tablename__ = "current_model"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="current_model")