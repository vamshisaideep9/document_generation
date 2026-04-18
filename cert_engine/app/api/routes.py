import os 
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from num2words import num2words
from datetime import datetime 

from app.core.config import get_db
from app.models.schema import GenerationRequest, GenerationLog
from app.services.generator import create_document

router = APIRouter()


SECRET_KEY = os.environ.get("SECRET_KEY")


DOCUMENT_SCHEMA_MAP = {
    "student": {
        "internship_certificate": {
            "template_file": "internship_sample.docx",
            "required_fields": ["name", "gender", "date", "domain", "course_name", "from_date", "to_date", "project_name"]
        }
    },
    "employee": {
        "experience_letter": {
            "template_file": "experience_letter_sample.docx",
            "required_fields": ["name", "gender", "date", "email", "phone_number", "job_role", "domain", "from_date", "to_date", "key_responsibilities", "tools_technologies"]
        },
        "relieving_letter": {
            "template_file": "releiving_letter_sample.docx",
            "required_fields": ["name", "gender", "date", "job_role", "from_date", "to_date", "relieving_date", "key_responsibilities"]
        },
        "monthly_payslip": {
            "template_file": "payslip_sample.docx",
            "required_fields": [
                "name", "month_year", "join_date", "designation", "department", "location", 
                "bank_name", "bank_acc_no", "branch", "ifsc_code", "pan_no", "days_in_month", "lop",
                "basic_full", "basic_actual", "hra_full", "hra_actual", "conv_full", "conv_actual", 
                "med_full", "med_actual", "bonus_full", "bonus_actual", "spec_full", "spec_actual",
                "total_full", "total_actual", "net_total"
            ]
        }
    }
}

@router.get("/documents/schema")
async def get_document_schemas() -> Dict[str, Any]:
    return {"modules": DOCUMENT_SCHEMA_MAP}

@router.post("/generate")
async def generate_document(payload: GenerationRequest, db: AsyncSession = Depends(get_db)):
    if payload.secret_key != SECRET_KEY:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: Invalid Secret Key"
        )
    
    context = payload.model_dump(exclude_none=True)
    for key, value in context.items():
        if not value: continue

        if "date" in key.lower():
            try:
                date_obj = datetime.strptime(value, "%Y-%m-%d")
                context[key] = date_obj.strftime("%d-%m-%Y")
            except (ValueError, TypeError):
                continue
        if key == "month_year":
            try:
                date_obj = datetime.strptime(value, "%Y-%m")
                context[key] = date_obj.strftime("%B %Y") 
            except (ValueError, TypeError):
                continue


    if payload.gender:
        g = payload.gender.lower()
        if g == "male":
            context.update({
                "title": "Mr.", "sub": "He", "obj": "him", "poss": "his",
                "sub_cap": "He", "poss_cap": "His"
            })
        elif g == "female":
            context.update({
                "title": "Ms.", "sub": "She", "obj": "her", "poss": "her",
                "sub_cap": "She", "poss_cap": "Her"
            })

    if payload.template_name == "payslip_sample.docx" and payload.net_total:
        try:
            raw_total = str(payload.net_total).replace(',', '')
            numeric_total = float(raw_total)
            words = num2words(numeric_total, lang='en_IN').replace('-', ' ').title()
            context['net_total_in_words'] = f"{words} Rupees Only"
        except (ValueError, TypeError):
             pass 
    try:
        file_stream = create_document(
            payload.template_name, 
            context, 
            output_format=payload.export_format
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engine failure: {str(e)}")

    log_entry = GenerationLog(recipient_name=payload.name, template_name=payload.template_name)
    db.add(log_entry)
    await db.commit()
    
    clean_name = payload.name.replace(" ", "_")
    ext = payload.export_format.lower()

    if payload.template_name == "payslip_sample.docx":
        try:
            dt = datetime.strptime(payload.month_year, "%Y-%m")
            month_val = dt.strftime("%B") 
            year_val = dt.strftime("%Y")   
            final_filename = f"{clean_name}_{month_val}_{year_val}_payslip.{ext}"
        except (ValueError, TypeError, AttributeError):
            final_filename = f"{clean_name}_payslip.{ext}"
    else:
        human_readable_doc = payload.template_name.replace('_sample.docx', '').replace('_', ' ').title()
        final_filename = f"{clean_name}_{human_readable_doc.replace(' ', '_')}.{ext}"
    
    mime_type = "application/pdf" if ext == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    headers = {
        'Content-Disposition': f'attachment; filename="{final_filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition'
    }
    
    return StreamingResponse(file_stream, media_type=mime_type, headers=headers)