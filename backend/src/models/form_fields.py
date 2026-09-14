from .base import Base
from sqlalchemy import (
    JSON, Column, String, Integer, Boolean, ForeignKey, DateTime, Numeric, Index
)
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ENUM, UUID
import uuid
from sqlalchemy.orm import relationship
from ..utils.enums import SubmissionStatusEnum, StageActionStatusEnum



class SubmissionDetails(Base):
    __tablename__ = 'submission_details'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    acronym = Column(String(15),nullable=False)
    value = Column(Numeric(20, 4), nullable=False)

    submission_id = Column(UUID, ForeignKey("submission_master.id"), nullable=False)

    # Reverse relationship
    submission = relationship("SubmissionMaster", back_populates="details")

    # Indexes for faster search
    __table_args__ = (
        Index("idx_submission_details_submission_id", "submission_id"),
    )

class SubmissionMaster(Base):
    __tablename__ = "submission_master"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id = Column(UUID, ForeignKey("entities.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("submission_period.id"), nullable=False)
    fy_id = Column(Integer, ForeignKey("financial_year.id"), nullable=False)

    status = Column(ENUM(SubmissionStatusEnum, name="submission_status"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    created_by = Column(UUID, ForeignKey("users.id"), nullable=False)

    # Current stage of workflow
    stage = Column(Integer, nullable=False)

    logic_snapshot = Column(JSON, nullable=True)

    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    is_closed = Column(Integer, default=0)  # 0 = open, 1 = closed
    closed_at = Column(DateTime(timezone=True), nullable=True)
    workflow = relationship("Workflow", back_populates="forms")
    # add upload array that will store the file paths of uploaded files
    uploads = Column(JSON, nullable=True)

    # Relationship to workflow definition
    workflow = relationship("Workflow", back_populates="forms")

    # 1:N → Details
    details = relationship(
        "SubmissionDetails",
        back_populates="submission",
        cascade="all, delete-orphan"
    )

    # 1:N → Stage History
    stage_history = relationship(
        "SubmissionStageHistory",
        back_populates="submission",
        cascade="all, delete-orphan"
    )

    # Indexes for frequent search
    __table_args__ = (
        Index("idx_submission_entity", "entity_id"),
        Index("idx_submission_period", "period_id"),
        Index("idx_submission_fy", "fy_id"),
    )

class SubmissionStageHistory(Base):
    __tablename__ = "submission_stage_history"

    id = Column(Integer, primary_key=True, autoincrement=True)

    submission_id = Column(UUID, ForeignKey("submission_master.id"), nullable=False)
    stage_number = Column(Integer, nullable=False)

    action_status = Column(
        ENUM(StageActionStatusEnum, name="stage_action_status"),
        nullable=False
    )

    comments = Column(String(500), nullable=True)

    action_by = Column(UUID, ForeignKey("users.id"), nullable=True)
    action_at = Column(DateTime(timezone=True), server_default=func.now())

    attachments = Column(JSON, nullable=True)

    # Reverse relationship
    submission = relationship("SubmissionMaster", back_populates="stage_history")

    __table_args__ = (
        Index("idx_stage_history_submission_id", "submission_id"),
    )
