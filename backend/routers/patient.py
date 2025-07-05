# ✅ backend/routers/patient.py (Updated)

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Patient, MedicalRecord
from schemas import MedicalRecordCreate
import pytesseract
from pdf2image import convert_from_bytes
import os
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime
import json

# ✅ Import ML model & encoder
from routers.ai_assistant import model, encoder

load_dotenv()
router = APIRouter(prefix="/patients", tags=["Patients"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_pdf(file: UploadFile):
    images = convert_from_bytes(file.file.read())
    full_text = ""
    for img in images:
        full_text += pytesseract.image_to_string(img)
    return full_text

def generate_llm_summary(name: str, symptoms: str, doc_text: str, predicted_disease: str):
    prompt = f"""
    Patient Name: {name}
    Symptoms: {symptoms}
    Extracted Medical Document (OCR):
    {doc_text}

    Predicted Disease: {predicted_disease}

    ✅ Your task:
    Respond strictly in JSON format with keys:
    - name, birth_date, weight, height, allergies, medications, insurance_provider, insurance_expiry
    - notable_conditions, immunizations
    - disease, insights, treatment, precautions
    """
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

@router.post("/extract-info")
async def extract_patient_info(document: UploadFile = File(...)):
    extracted_text = extract_text_from_pdf(document)
    dummy_symptoms = "headache, fever"
    predicted_disease = "Unknown"
    try:
        summary_raw = generate_llm_summary("", dummy_symptoms, extracted_text, predicted_disease)

        # ✅ Remove markdown/code block formatting
        if "```" in summary_raw:
            summary_raw = summary_raw.split("```")[1].strip()

        # ✅ Remove comments (like // IMMUNE) to make valid JSON
        import re
        summary_raw = re.sub(r"//.*", "", summary_raw)  # removes // comments

        structured = json.loads(summary_raw)
        return structured
    except Exception as e:
        return {
            "error": "LLM parsing failed",
            "raw_response": summary_raw,
            "exception": str(e)
        }


@router.post("/")
async def create_patient(
    name: str = Form(None),
    age: int = Form(None),
    contact: str = Form(None),
    dob: str = Form(None),
    symptoms: str = Form(...),
    allergies: str = Form(None),
    previous_diseases: str = Form(None),
    weight: str = Form(None),
    height: str = Form(None),
    hospital_id: int = Form(...),
    medications: str = Form(None),
    document: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    extracted_text = extract_text_from_pdf(document)
    input_symptoms = [s.strip().lower().replace(" ", "_") for s in symptoms.split(",")]
    X = encoder.transform([input_symptoms])
    predicted_disease = model.predict(X)[0]

    new_patient = Patient(
        name=name or "Unknown",
        age=age or 0,
        contact=contact or "N/A",
        dob=dob or "Unknown",
        symptoms=symptoms,
        allergies=allergies,
        previous_diseases=previous_diseases,
        weight=weight,
        height=height,
        medical_summary=extracted_text,
        hospital_id=hospital_id,
        medications=medications,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # ✅ Add initial medical record
    new_record = MedicalRecord(
        patient_id=new_patient.id,
        symptoms=symptoms,
        document_summary=extracted_text,
        visit_date=str(datetime.now()),
        allergies=allergies,
        previous_diseases=previous_diseases,
        medications=medications,
        weight=weight,
        height=height
    )
    db.add(new_record)
    db.commit()

    return {
        "message": "✅ Patient and initial medical record added",
        "patient": {
            "id": new_patient.id,
            "name": new_patient.name,
            "predicted_disease": predicted_disease,
            "document_summary": extracted_text
        }
    }

@router.get("/hospital/{hospital_id}")
def get_patients(hospital_id: int, db: Session = Depends(get_db)):
    return db.query(Patient).filter(Patient.hospital_id == hospital_id).all()

@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}
    db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).delete()
    db.delete(patient)
    db.commit()
    return {"message": "✅ Patient and all related medical records deleted"}

@router.post("/update/{patient_id}")
def update_patient(
    patient_id: int,
    name: str = Form(None),
    age: int = Form(None),
    contact: str = Form(None),
    dob: str = Form(None),
    symptoms: str = Form(None),
    allergies: str = Form(None),
    previous_diseases: str = Form(None),
    weight: str = Form(None),
    height: str = Form(None),
    medications: str = Form(None),
    document: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}

    for field in ["name", "age", "contact", "dob", "symptoms", "allergies", "previous_diseases", "weight", "height", "medications"]:
        value = locals()[field]
        if value:
            setattr(patient, field, value)

    extracted_text = ""
    if document:
        extracted_text = extract_text_from_pdf(document)

    new_record = MedicalRecord(
        patient_id=patient_id,
        symptoms=symptoms or patient.symptoms,
        document_summary=extracted_text or "N/A",
        visit_date=str(datetime.now()),
        allergies=allergies or patient.allergies,
        previous_diseases=previous_diseases or patient.previous_diseases,
        medications=medications or patient.medications,
        weight=weight or patient.weight,
        height=height or patient.height
    )
    db.add(new_record)
    db.commit()
    db.refresh(patient)
    return {"message": "✅ Patient updated and medical record added"}

@router.get("/{patient_id}/records")
def get_medical_records(patient_id: int, db: Session = Depends(get_db)):
    return db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).all()

@router.post("/{patient_id}/records")
def add_medical_record(patient_id: int, record: MedicalRecordCreate, db: Session = Depends(get_db)):
    new_record = MedicalRecord(
        patient_id=patient_id,
        symptoms=record.symptoms,
        document_summary=record.document_summary,
        visit_date=record.visit_date,
        allergies=record.allergies,
        previous_diseases=record.previous_diseases,
        medications=record.medications,
        weight=record.weight,
        height=record.height
    )
    db.add(new_record)

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        patient.symptoms = record.symptoms
        patient.allergies = record.allergies
        patient.previous_diseases = record.previous_diseases
        patient.medications = record.medications
        patient.weight = record.weight
        patient.height = record.height
        db.add(patient)

    db.commit()
    db.refresh(patient)

    return {"message": "✅ Medical record added and patient updated"}
