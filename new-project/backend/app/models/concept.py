import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class ConceptHistory(Base):
    __tablename__ = "concept_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    concept = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="concept_history")
    folder = relationship("Folder", back_populates="knowledge_trees")
    terms = relationship("Term", back_populates="history", cascade="all, delete-orphan")
    knowledge_points = relationship("KnowledgePoint", back_populates="history", cascade="all, delete-orphan")


class Term(Base):
    __tablename__ = "terms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    history_id = Column(UUID(as_uuid=True), ForeignKey("concept_history.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("terms.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(200), nullable=False)
    definition = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    is_expanded = Column(Boolean, default=False)
    is_breaking_down = Column(Boolean, default=False)
    path = Column(String(1000), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history = relationship("ConceptHistory", back_populates="terms")
    parent = relationship("Term", remote_side=[id], back_populates="children")
    children = relationship("Term", back_populates="parent", cascade="all, delete-orphan")
    children_knowledge_points = relationship("KnowledgePoint", back_populates="parent_term")


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    history_id = Column(UUID(as_uuid=True), ForeignKey("concept_history.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_points.id", ondelete="CASCADE"), nullable=True)
    parent_term_id = Column(UUID(as_uuid=True), ForeignKey("terms.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    sort_order = Column(Integer, default=0)
    is_expanded = Column(Boolean, default=False)
    is_breaking_down = Column(Boolean, default=False)
    path = Column(String(1000), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history = relationship("ConceptHistory", back_populates="knowledge_points")
    parent = relationship("KnowledgePoint", remote_side=[id], back_populates="children")
    children = relationship("KnowledgePoint", back_populates="parent", cascade="all, delete-orphan")
    parent_term = relationship("Term", back_populates="children_knowledge_points")