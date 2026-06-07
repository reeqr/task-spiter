import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class QueryAction(Base):
    __tablename__ = "query_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_key = Column(String(50), nullable=False)  # knowledge-explain, exam-angle, common-traps
    label = Column(String(100), nullable=False)  # 解释, 出题角度, 易错点
    query_template = Column(Text, nullable=False)
    followup_template = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    is_system = Column(Boolean, default=False)  # true = 内置不可删
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="query_actions")


class WebSearchConfig(Base):
    __tablename__ = "web_search_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    enabled = Column(Boolean, default=False)
    search_engine = Column(String(20), default="search_pro")
    count = Column(Integer, default=5)
    search_domain_filter = Column(String(500), default="")
    search_recency_filter = Column(String(20), default="noLimit")
    content_size = Column(String(10), default="high")
    search_prompt = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="web_search_config")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    concept_breakdown_template = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")