from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Hospital
from schemas import HospitalCreate, HospitalLogin
from database import SessionLocal
from passlib.hash import bcrypt

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(hospital: HospitalCreate, db: Session = Depends(get_db)):
    db_hospital = Hospital(**hospital.dict())
    db_hospital.password = bcrypt.hash(db_hospital.password)
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return {
        "message": "Hospital registered successfully.",
        "hospital_id": db_hospital.id,
        "name": db_hospital.name
    }


@router.post("/login")
def login(data: HospitalLogin, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.email == data.email).first()
    if not hospital or not bcrypt.verify(data.password, hospital.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    return {
        "access_token": "dummy-jwt-token",
        "name": hospital.name,              # ✅ Add this
        "hospital_id": hospital.id          # ✅ And this
    }
