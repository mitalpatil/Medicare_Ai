from faker import Faker
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Patient, MedicalRecord, DiseaseHistory

faker = Faker()

HOSPITAL_ID = 1
NUM_PATIENTS = 100

SYMPTOMS = [
    "Fever", "Cough", "Fatigue", "Headache", "Shortness of breath", "Chest pain",
    "Nausea", "Vomiting", "Dizziness", "Muscle pain", "Joint pain", "Sore throat"
]

ALLERGIES = ["Dust", "Pollen", "Peanuts", "None", "Seafood", "Penicillin"]
DISEASES = ["Asthma", "Diabetes", "Hypertension", "Migraine", "COVID-19", "Tuberculosis"]
MEDICATIONS = ["Paracetamol", "Ibuprofen", "Metformin", "Aspirin", "Antihistamines"]

def generate_dummy_patient():
    name = faker.name()
    age = random.randint(1, 90)
    contact = faker.phone_number()
    dob = faker.date_of_birth(minimum_age=1, maximum_age=90).strftime("%Y-%m-%d")
    symptoms_list = random.sample(SYMPTOMS, k=random.randint(1, 4))
    symptoms = ", ".join(symptoms_list)
    allergies = random.choice(ALLERGIES)
    previous_diseases = random.choice(DISEASES)
    weight = str(random.randint(30, 100))
    height = str(random.randint(120, 200))
    medications = random.choice(MEDICATIONS)

    summary = (
        f"Patient reports {', '.join(symptoms_list)}. "
        f"History of {previous_diseases}. Allergic to {allergies}. "
        f"Currently taking {medications}. Vitals: {weight}kg, {height}cm."
    )

    return Patient(
        name=name,
        age=age,
        contact=contact,
        dob=dob,
        symptoms=symptoms,
        allergies=allergies,
        previous_diseases=previous_diseases,
        weight=weight,
        height=height,
        medical_summary=summary,
        hospital_id=HOSPITAL_ID,
        medications=medications,
    )

def seed_database():
    db: Session = SessionLocal()

    for _ in range(NUM_PATIENTS):
        patient = generate_dummy_patient()
        db.add(patient)
        db.commit()
        db.refresh(patient)

        # Create medical record
        record = MedicalRecord(
            patient_id=patient.id,
            symptoms=patient.symptoms,
            document_summary=patient.medical_summary,
            visit_date=faker.date_this_year().strftime("%Y-%m-%d"),
            allergies=patient.allergies,
            previous_diseases=patient.previous_diseases,
            medications=patient.medications,
            weight=patient.weight,
            height=patient.height
        )
        db.add(record)

        # Create disease history
        disease = DiseaseHistory(
            patient_id=patient.id,
            symptoms=patient.symptoms,
            predicted_disease=patient.previous_diseases,
            created_at=faker.date_time_this_year().strftime("%Y-%m-%d %H:%M")
        )
        db.add(disease)

        db.commit()

    db.close()
    print(f"✅ Seeded {NUM_PATIENTS} patients with records into hospital_id={HOSPITAL_ID}")

if __name__ == "__main__":
    seed_database()
