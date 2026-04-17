from sqlalchemy import Column, String, DateTime, func
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Union
import uuid
from app.core.config import Base


# ---- SQLAlchemy Models (PostgreSQL) ---
class GenerationLog(Base):
    """Audit log for generated certificates/letters."""
    __tablename__ = "generation_tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_name = Column(String, nullable=False)
    template_name = Column(String, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


class GenerationRequest(BaseModel):
    template_name: str
    export_format: str = "docx"
    name: str
    gender: Optional[str] = None
    
    # Standard Fields
    date: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    domain: Optional[str] = None
    job_role: Optional[str] = None
    course_name: Optional[str] = None
    project_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    relieving_date: Optional[str] = None
    key_responsibilities: Optional[str] = None
    tools_technologies: Optional[str] = None

    # --- Payslip Specific Fields (Relaxed Types) ---
    month_year: Optional[str] = None
    bank_name: Optional[str] = None
    bank_acc_no: Optional[str] = None
    branch: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_no: Optional[str] = None
    join_date: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    days_in_month: Optional[Union[str, int]] = None
    lop: Optional[Union[str, int]] = None
    
    # Earnings & Totals (Allowing both user typing and JS calculations)
    basic_full: Optional[Union[str, float]] = None
    basic_actual: Optional[Union[str, float]] = None
    hra_full: Optional[Union[str, float]] = None
    hra_actual: Optional[Union[str, float]] = None
    conv_full: Optional[Union[str, float]] = None
    conv_actual: Optional[Union[str, float]] = None
    med_full: Optional[Union[str, float]] = None
    med_actual: Optional[Union[str, float]] = None
    bonus_full: Optional[Union[str, float]] = None
    bonus_actual: Optional[Union[str, float]] = None
    spec_full: Optional[Union[str, float]] = None
    spec_actual: Optional[Union[str, float]] = None
    total_full: Optional[Union[str, float]] = None
    total_actual: Optional[Union[str, float]] = None
    net_total: Optional[Union[str, float]] = None