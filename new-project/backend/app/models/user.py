import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    providers = relationship("Provider", back_populates="user", cascade="all, delete-orphan")
    models = relationship("Model", back_populates="user", cascade="all, delete-orphan")
    concept_history = relationship("ConceptHistory", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    query_actions = relationship("QueryAction", back_populates="user", cascade="all, delete-orphan")
    web_search_config = relationship("WebSearchConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")
    current_model = relationship("CurrentModel", back_populates="user", uselist=False, cascade="all, delete-orphan")