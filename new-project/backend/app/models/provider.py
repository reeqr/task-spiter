import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    provider_type = Column(String(50), nullable=False)  # zhipu, openai, anthropic, deepseek, etc.
    base_url = Column(String(500), nullable=False, default="")
    icon = Column(String(10), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="providers")
    credential = relationship("ProviderCredential", back_populates="provider", uselist=False, cascade="all, delete-orphan")
    models = relationship("Model", back_populates="provider", cascade="all, delete-orphan")


class ProviderCredential(Base):
    __tablename__ = "provider_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="CASCADE"), unique=True, nullable=False)
    api_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", back_populates="credential")