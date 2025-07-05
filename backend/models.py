from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base
from sqlalchemy.orm import relationship

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    password = Column(String)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    contact = Column(String)
    dob = Column(String)
    symptoms = Column(String)
    allergies = Column(String)  # ✅ New
    previous_diseases = Column(String)  # ✅ New
    weight = Column(String)  # ✅ New
    height = Column(String)  # ✅ New
    medical_summary = Column(String)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    medications = Column(String) 
    medical_records = relationship(
    "MedicalRecord",
    back_populates="patient",
    cascade="all, delete",
    passive_deletes=True
)

    disease_history = relationship(
    "DiseaseHistory",
    back_populates="patient",
    cascade="all, delete",
    passive_deletes=True
)


# models.py
class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    symptoms = Column(String)
    document_summary = Column(String)
    visit_date = Column(String)
    allergies = Column(String)
    previous_diseases = Column(String)
    medications = Column(String)
    weight = Column(String)
    height = Column(String)

    patient = relationship("Patient", back_populates="medical_records")

class DiseaseHistory(Base):
    __tablename__ = "disease_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    symptoms = Column(String)
    predicted_disease = Column(String)
    created_at = Column(String)  # Can store timestamp string or use DateTime

    patient = relationship("Patient", back_populates="disease_history")
class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("disease_history.id"))
    treatment = Column(String)
    medication = Column(String)
    tests = Column(String)
    precaution = Column(String)
