from database import SessionLocal
from models import Hospital

db = SessionLocal()
db.query(Hospital).delete()
db.commit()
print("✅ All hospitals deleted.")
