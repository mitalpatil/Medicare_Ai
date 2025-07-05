from database import SessionLocal
from models import Patient, MedicalRecord, DiseaseHistory, TreatmentPlan

def delete_all_patients():
    db = SessionLocal()
    try:
        # Delete dependent records first to avoid foreign key constraints
        db.query(TreatmentPlan).delete()
        db.query(DiseaseHistory).delete()
        db.query(MedicalRecord).delete()
        db.query(Patient).delete()

        db.commit()
        print("✅ All patients and related data deleted.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during deletion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_patients()
