from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# -------------------------------
# Hospital Schemas
# -------------------------------

class HospitalCreate(BaseModel):
    name: str
    address: str
    email: str
    phone: str
    password: str

class HospitalLogin(BaseModel):
    email: str
    password: str

# -------------------------------
# Patient Schemas
# -------------------------------

class PatientCreate(BaseModel):
    name: str
    age: int
    contact: str
    dob: str
    symptoms: str
    allergies: Optional[str] = None
    previous_diseases: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    hospital_id: int
    medications: Optional[str] = None

# -------------------------------
# Medical Record Schemas
# -------------------------------

class MedicalRecordCreate(BaseModel):
    symptoms: str
    visit_date: str
    allergies: str
    previous_diseases: str
    medications: str
    weight: str
    height: str

# -------------------------------
# Disease History Schemas
# -------------------------------

class DiseaseHistoryCreate(BaseModel):
    symptoms: str
    predicted_disease: str
    created_at: Optional[str] = None  # Optional during creation

# -------------------------------
# Treatment Plan Schemas
# -------------------------------

class TreatmentPlanCreate(BaseModel):
    treatment: str
    medication: str
    tests: str
    precaution: str
    disease_id: int  # FK to DiseaseHistory
