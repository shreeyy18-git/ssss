from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "disaster_preparedness_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Disaster Preparedness System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class UserBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    role: str  # admin, teacher, student
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    pass

class UserInDB(UserBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    questions: List[dict]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    quiz_id: str
    score: int
    total_questions: int
    answers: List[dict]
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DrillParticipation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    drill_type: str
    participated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    alert_type: str  # fire, earthquake, flood, etc.
    severity: str    # low, medium, high, critical
    active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    type: str  # police, fire, ambulance, disaster
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DisasterPrediction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    city: str
    risk_percentage: float
    disaster_types: List[str]
    factors: List[str]
    predicted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    predicted_by: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return User(**user)

# Initialize default data
async def initialize_default_data():
    # Check if admin exists
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        # Create default admin
        admin_user = UserInDB(
            username="admin",
            email="admin@school.edu",
            full_name="System Administrator",
            role="admin",
            hashed_password=get_password_hash("admin123")
        )
        await db.users.insert_one(admin_user.dict())
        
        # Create default teacher
        teacher_user = UserInDB(
            username="teacher1",
            email="teacher@school.edu", 
            full_name="John Teacher",
            role="teacher",
            hashed_password=get_password_hash("teacher123")
        )
        await db.users.insert_one(teacher_user.dict())
        
        # Create default student
        student_user = UserInDB(
            username="student1",
            email="student@school.edu",
            full_name="Jane Student", 
            role="student",
            hashed_password=get_password_hash("student123")
        )
        await db.users.insert_one(student_user.dict())
        
        # Create default emergency contacts
        contacts = [
            {"name": "Police", "phone": "911", "type": "police", "description": "Emergency Police Services"},
            {"name": "Fire Department", "phone": "911", "type": "fire", "description": "Fire Emergency Services"},
            {"name": "Ambulance", "phone": "911", "type": "ambulance", "description": "Medical Emergency Services"},
            {"name": "Disaster Helpline", "phone": "1-800-DISASTER", "type": "disaster", "description": "Disaster Response Helpline"}
        ]
        
        for contact_data in contacts:
            contact = EmergencyContact(**contact_data)
            await db.emergency_contacts.insert_one(contact.dict())
            
        # Create sample quiz
        sample_quiz = Quiz(
            title="Basic Disaster Preparedness",
            questions=[
                {
                    "question": "What should you do first during an earthquake?",
                    "options": ["Run outside", "Drop, Cover, and Hold On", "Stand in doorway", "Call 911"],
                    "correct": 1
                },
                {
                    "question": "How many days of emergency supplies should you have?",
                    "options": ["1 day", "3 days", "7 days", "14 days"],
                    "correct": 1
                },
                {
                    "question": "What is the safest place during a tornado?",
                    "options": ["Under a bridge", "In a car", "Basement or interior room", "Outside"],
                    "correct": 2
                }
            ]
        )
        await db.quizzes.insert_one(sample_quiz.dict())

# Authentication Routes
@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# User Management Routes
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_in_db = UserInDB(
        **user.dict(exclude={"password"}),
        hashed_password=get_password_hash(user.password)
    )
    
    await db.users.insert_one(user_in_db.dict())
    return User(**user_in_db.dict())

# Quiz Routes
@api_router.get("/quizzes", response_model=List[Quiz])
async def get_quizzes(current_user: User = Depends(get_current_user)):
    quizzes = await db.quizzes.find().to_list(length=None)
    return [Quiz(**quiz) for quiz in quizzes]

@api_router.post("/quiz-attempts", response_model=QuizAttempt)
async def submit_quiz(attempt: QuizAttempt, current_user: User = Depends(get_current_user)):
    attempt.user_id = current_user.id
    await db.quiz_attempts.insert_one(attempt.dict())
    return attempt

@api_router.get("/quiz-attempts/{user_id}", response_model=List[QuizAttempt])
async def get_quiz_attempts(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attempts = await db.quiz_attempts.find({"user_id": user_id}).to_list(length=None)
    return [QuizAttempt(**attempt) for attempt in attempts]

# Drill Routes
@api_router.post("/drills", response_model=DrillParticipation)
async def record_drill_participation(drill: DrillParticipation, current_user: User = Depends(get_current_user)):
    drill.user_id = current_user.id
    await db.drill_participations.insert_one(drill.dict())
    return drill

@api_router.get("/drills/{user_id}", response_model=List[DrillParticipation])
async def get_drill_participations(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    drills = await db.drill_participations.find({"user_id": user_id}).to_list(length=None)
    return [DrillParticipation(**drill) for drill in drills]

# Alert Routes
@api_router.get("/alerts", response_model=List[Alert])
async def get_active_alerts(current_user: User = Depends(get_current_user)):
    alerts = await db.alerts.find({"active": True}).to_list(length=None)
    return [Alert(**alert) for alert in alerts]

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert: Alert, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    alert.created_by = current_user.id
    await db.alerts.insert_one(alert.dict())
    return alert

class AlertUpdate(BaseModel):
    active: bool

@api_router.put("/alerts/{alert_id}")
async def update_alert(alert_id: str, alert_update: AlertUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.alerts.update_one({"id": alert_id}, {"$set": {"active": alert_update.active}})
    return {"message": "Alert updated successfully"}

# Emergency Contacts Routes
@api_router.get("/emergency-contacts", response_model=List[EmergencyContact])
async def get_emergency_contacts(current_user: User = Depends(get_current_user)):
    contacts = await db.emergency_contacts.find().to_list(length=None)
    return [EmergencyContact(**contact) for contact in contacts]

@api_router.post("/emergency-contacts", response_model=EmergencyContact)
async def create_emergency_contact(contact: EmergencyContact, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.emergency_contacts.insert_one(contact.dict())
    return contact

@api_router.put("/emergency-contacts/{contact_id}", response_model=EmergencyContact)
async def update_emergency_contact(contact_id: str, contact: EmergencyContact, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    contact.updated_at = datetime.now(timezone.utc)
    await db.emergency_contacts.update_one({"id": contact_id}, {"$set": contact.dict()})
    return contact

# Disaster Prediction Routes
@api_router.post("/predict-disaster", response_model=DisasterPrediction)
async def predict_disaster(city: str, current_user: User = Depends(get_current_user)):
    # Simple ML logic based on city characteristics
    city_lower = city.lower()
    risk_factors = []
    disaster_types = []
    base_risk = 10
    
    # Coastal cities - higher flood/hurricane risk
    coastal_cities = ["miami", "new orleans", "san francisco", "seattle", "boston", "new york"]
    if any(coastal in city_lower for coastal in coastal_cities):
        base_risk += 25
        disaster_types.extend(["flood", "hurricane"])
        risk_factors.append("Coastal location")
    
    # Earthquake prone areas
    earthquake_cities = ["san francisco", "los angeles", "seattle", "alaska"]
    if any(eq_city in city_lower for eq_city in earthquake_cities):
        base_risk += 20
        disaster_types.append("earthquake")
        risk_factors.append("Seismic activity zone")
    
    # Tornado alley
    tornado_cities = ["oklahoma", "kansas", "texas", "nebraska", "iowa"]
    if any(tornado_city in city_lower for tornado_city in tornado_cities):
        base_risk += 15
        disaster_types.append("tornado")
        risk_factors.append("Tornado alley region")
    
    # Wildfire prone areas
    wildfire_cities = ["california", "arizona", "colorado", "montana"]
    if any(wf_city in city_lower for wf_city in wildfire_cities):
        base_risk += 18
        disaster_types.append("wildfire")
        risk_factors.append("Dry climate/vegetation")
    
    # Default disasters for all areas
    if not disaster_types:
        disaster_types = ["severe weather", "power outage"]
        risk_factors.append("Standard weather risks")
    
    # Cap the risk at 85%
    final_risk = min(base_risk, 85)
    
    prediction = DisasterPrediction(
        city=city,
        risk_percentage=final_risk,
        disaster_types=disaster_types,
        factors=risk_factors,
        predicted_by=current_user.id
    )
    
    await db.disaster_predictions.insert_one(prediction.dict())
    return prediction

@api_router.get("/predictions", response_model=List[DisasterPrediction])
async def get_predictions(current_user: User = Depends(get_current_user)):
    predictions = await db.disaster_predictions.find().sort("predicted_at", -1).limit(50).to_list(length=None)
    return [DisasterPrediction(**pred) for pred in predictions]

# User Stats Route
@api_router.get("/user-stats/{user_id}")
async def get_user_stats(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get quiz attempts
    quiz_attempts = await db.quiz_attempts.find({"user_id": user_id}).to_list(length=None)
    total_quizzes = len(quiz_attempts)
    total_points = sum(attempt["score"] for attempt in quiz_attempts)
    
    # Get drill participations
    drill_participations = await db.drill_participations.find({"user_id": user_id}).to_list(length=None)
    total_drills = len(drill_participations)
    
    # Convert MongoDB documents to JSON-serializable format
    recent_quiz_attempts = []
    for attempt in quiz_attempts[-5:] if quiz_attempts else []:
        # Remove MongoDB ObjectId and convert to dict
        attempt_dict = {k: v for k, v in attempt.items() if k != '_id'}
        recent_quiz_attempts.append(attempt_dict)
    
    recent_drill_participations = []
    for drill in drill_participations[-5:] if drill_participations else []:
        # Remove MongoDB ObjectId and convert to dict
        drill_dict = {k: v for k, v in drill.items() if k != '_id'}
        recent_drill_participations.append(drill_dict)
    
    return {
        "user_id": user_id,
        "total_quizzes_completed": total_quizzes,
        "total_points": total_points,
        "total_drills_participated": total_drills,
        "recent_quiz_attempts": recent_quiz_attempts,
        "recent_drill_participations": recent_drill_participations
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await initialize_default_data()
    logger.info("Application started and default data initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()