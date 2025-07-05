from fastapi import APIRouter, Depends ,HTTPException
from pydantic import BaseModel
from typing import List, Dict
import joblib
from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db
from models import Patient, DiseaseHistory , TreatmentPlan



load_dotenv()
router = APIRouter(prefix="/ai", tags=["AI Assistant"])

model = joblib.load("disease_model.pkl")
encoder = joblib.load("symptom_encoder.pkl")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class PredictRequest(BaseModel):
    symptoms: List[str]

@router.post("/predict")
def predict_disease(request: PredictRequest, patient_id: int, db: Session = Depends(get_db)):
    symptoms = [s.strip().lower().replace(" ", "_") for s in request.symptoms]
    X = encoder.transform([symptoms])
    prediction = model.predict(X)[0]

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}

    latest_record = (
        db.query(DiseaseHistory)
        .filter(DiseaseHistory.patient_id == patient_id)
        .order_by(DiseaseHistory.id.desc())
        .first()
    )

    # Save new record only if symptoms or prediction changed
    if not latest_record or latest_record.symptoms != ", ".join(request.symptoms) or latest_record.predicted_disease != prediction:
        new_history = DiseaseHistory(
            patient_id=patient_id,
            symptoms=", ".join(request.symptoms),
            predicted_disease=prediction,
            created_at=datetime.now().isoformat()
        )
        db.add(new_history)
        db.commit()

    return {"predicted_disease": prediction}


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
class TreatmentRequest(BaseModel):
    treatment: str
    medication: str
    tests: str
    precaution: str

@router.post("/treatment-plan/{patient_id}/add")
def add_treatment_plan(
    patient_id: int,
    data: TreatmentRequest,
    db: Session = Depends(get_db)
):
    # Get the latest disease history entry for linking
    history = (
        db.query(DiseaseHistory)
        .filter(DiseaseHistory.patient_id == patient_id)
        .order_by(DiseaseHistory.id.desc())
        .first()
    )

    if not history:
        raise HTTPException(status_code=404, detail="No disease history found for patient")

    treatment_plan = TreatmentPlan(
        disease_id=history.id,
        treatment=data.treatment,
        medication=data.medication,
        tests=data.tests,
        precaution=data.precaution
    )
    db.add(treatment_plan)
    db.commit()

    return {"message": "✅ Treatment plan saved to TreatmentPlan table."}
@router.post("/chat")
def chat_with_ai(request: ChatRequest):
    # Extract disease from system message or last user message (optional improvement)
    user_message = next((msg.content for msg in reversed(request.messages) if msg.role == "user"), "")
    
    # Optional: Extract predicted disease again (e.g., by parsing input symptoms or saving it earlier)

    # Build system message context
    system_message = {
        "role": "system",
        "content": (
            "You are a highly knowledgeable medical assistant. "
            "Use the provided patient's symptoms and predicted disease to offer precise "
            "treatment advice, precautions, and answer further medical queries."
        )
    }

    # Inject context message (optional if not already provided)
    chat_input = [system_message] + [msg.dict() for msg in request.messages]

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=chat_input
    )

    return {"reply": response.choices[0].message.content.strip()}

@router.get("/treatment-plan/{patient_id}/list")
def get_treatment_plans(patient_id: int, db: Session = Depends(get_db)):
    from models import TreatmentPlan, DiseaseHistory

    history_ids = db.query(DiseaseHistory.id).filter(DiseaseHistory.patient_id == patient_id).subquery()

    plans = db.query(TreatmentPlan).filter(TreatmentPlan.disease_id.in_(history_ids)).all()

    return [
        {
            "id": plan.id,
            "treatment": plan.treatment,
            "medication": plan.medication,
            "tests": plan.tests,
            "precaution": plan.precaution,
        }
        for plan in plans
    ]

@router.delete("/treatment-plan/{plan_id}/delete")
def delete_treatment_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    db.delete(plan)
    db.commit()
    return {"message": "🗑️ Treatment plan deleted successfully."}

@router.put("/treatment-plan/{plan_id}/update")
def update_treatment_plan(plan_id: int, data: TreatmentRequest, db: Session = Depends(get_db)):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    plan.treatment = data.treatment
    plan.medication = data.medication
    plan.tests = data.tests
    plan.precaution = data.precaution
    db.commit()
    return {"message": "✏️ Treatment plan updated successfully."}
