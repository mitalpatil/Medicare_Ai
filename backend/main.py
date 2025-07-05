from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, patient ,ai_assistant
from database import engine
from models import Base

app = FastAPI()

# ✅ Allow React frontend to access FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Routers
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(ai_assistant.router)

@app.get("/")
def root():
    return {"message": "Medicare API Running"}
