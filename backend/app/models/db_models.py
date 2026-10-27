from datetime import datetime
import json
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class NetworkMeasurementRecord(Base):
    __tablename__ = "network_measurements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_type = Column(String(32), index=True) # "RIPE_ATLAS", "LOCAL_DIAGNOSTIC", "HISTORICAL"
    measurement_id = Column(String(64), index=True) # RIPE msm_id or local session ID
    target = Column(String(255), index=True)
    probe_id = Column(String(64), nullable=True, index=True)
    
    total_sent = Column(Integer, nullable=False)
    successful_rcvd = Column(Integer, nullable=False)
    failed_lost = Column(Integer, nullable=False)
    loss_percentage = Column(Float, nullable=False)
    
    avg_rtt = Column(Float, nullable=True)
    min_rtt = Column(Float, nullable=True)
    max_rtt = Column(Float, nullable=True)
    median_rtt = Column(Float, nullable=True)
    p95_rtt = Column(Float, nullable=True)
    
    timestamp_epoch = Column(Integer, index=True) # original measurement timestamp from source
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True) # when saved locally
    status = Column(String(32), default="SUCCESS")
    raw_metadata = Column(Text, nullable=True) # JSON payload

    events = relationship("LossEvent", back_populates="measurement", cascade="all, delete-orphan")

class LossEvent(Base):
    __tablename__ = "loss_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    measurement_id = Column(Integer, ForeignKey("network_measurements.id"), index=True)
    sequence_index = Column(Integer, nullable=False)
    is_loss = Column(Boolean, nullable=False) # True if dropped/unanswered, False if replied
    rtt_ms = Column(Float, nullable=True)
    timestamp_epoch = Column(Integer, nullable=True)

    measurement = relationship("NetworkMeasurementRecord", back_populates="events")

class StatisticalEvaluationRecord(Base):
    __tablename__ = "statistical_evaluations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    measurement_id = Column(Integer, ForeignKey("network_measurements.id"), nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    
    batch_n = Column(Integer, nullable=False)
    param_p = Column(Float, nullable=False)
    observed_loss = Column(Integer, nullable=False)
    expected_loss = Column(Float, nullable=False)
    variance = Column(Float, nullable=False)
    std_dev = Column(Float, nullable=False)
    
    wilson_ci_lower = Column(Float, nullable=True)
    wilson_ci_upper = Column(Float, nullable=True)
    runs_test_z = Column(Float, nullable=True)
    runs_test_pvalue = Column(Float, nullable=True)
    burstiness_index = Column(Float, nullable=True)
    classification = Column(String(64), nullable=True)
    summary_insight = Column(Text, nullable=True)
