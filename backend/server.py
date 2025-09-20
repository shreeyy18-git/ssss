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
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'disaster_preparedness')]

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

class Module(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    video_url: str
    video_duration: int  # duration in minutes
    order: int  # display order
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoCompletion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    module_id: str
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    watch_percentage: float = 100.0  # percentage of video watched

class Quiz(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    module_id: str  # Associated module
    questions: List[dict]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    quiz_id: str
    module_id: str  # Associated module
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
        
        # Create modules with YouTube videos
        modules_data = [
            {
                "title": "Fire Safety",
                "description": "Learn essential fire safety procedures, evacuation techniques, and prevention methods to protect yourself and others during fire emergencies.",
                "video_url": "https://youtu.be/ReL-DM9xhpI?si=tDeWcsHd4mK1yEAv",
                "video_duration": 8,
                "order": 1
            },
            {
                "title": "Earthquake Response", 
                "description": "Master the Drop, Cover, and Hold On technique and learn essential earthquake safety measures and post-earthquake procedures.",
                "video_url": "https://youtu.be/BLEPakj1YTY?si=h61YmR5yZQfYxapW",
                "video_duration": 7,
                "order": 2
            },
            {
                "title": "Flood Preparedness",
                "description": "Understand flood risks, evacuation procedures, water safety protocols, and how to prepare for flood emergencies.",
                "video_url": "https://youtu.be/43M5mZuzHF8?si=t7_jYxbItFkDFfnT",
                "video_duration": 6,
                "order": 3
            },
            {
                "title": "Emergency Kits",
                "description": "Learn what essential supplies to include in emergency kits for your home, school, and workplace to be prepared for any disaster.",
                "video_url": "https://youtu.be/UmiGvOha7As?si=fX8Ns_F_Nya2gseu",
                "video_duration": 9,
                "order": 4
            }
        ]
        
        created_modules = []
        for module_data in modules_data:
            module = Module(**module_data)
            await db.modules.insert_one(module.dict())
            created_modules.append(module)
        
        # Create module-specific quizzes
        quiz_data = [
            {
                "title": "Fire Safety Quiz",
                "module_id": created_modules[0].id,
                "questions": [
                    {
                        "question": "What should you do first when you discover a fire?",
                        "options": ["Try to put it out yourself", "Alert others and activate fire alarm", "Gather your belongings", "Take photos for insurance"],
                        "correct": 1
                    },
                    {
                        "question": "When escaping from a fire, you should:",
                        "options": ["Stand upright and run quickly", "Stay low and crawl below smoke", "Use the elevator for quick escape", "Stop to help others first"],
                        "correct": 1
                    },
                    {
                        "question": "Before opening a door during a fire emergency, you should:",
                        "options": ["Open it quickly to escape fast", "Feel the door handle and door for heat", "Knock to see if anyone is behind it", "Break it down if it's locked"],
                        "correct": 1
                    },
                    {
                        "question": "If your clothes catch fire, you should:",
                        "options": ["Run to get help", "Stop, Drop, and Roll", "Jump into water immediately", "Use your hands to pat out flames"],
                        "correct": 1
                    },
                    {
                        "question": "How often should smoke detector batteries be checked?",
                        "options": ["Once a year", "Every 6 months", "Once a month", "Only when they beep"],
                        "correct": 2
                    }
                ]
            },
            {
                "title": "Earthquake Response Quiz",
                "module_id": created_modules[1].id,
                "questions": [
                    {
                        "question": "What is the correct response when you feel earthquake shaking?",
                        "options": ["Run outside immediately", "Stand in a doorway", "Drop, Cover, and Hold On", "Get under a bed"],
                        "correct": 2
                    },
                    {
                        "question": "During an earthquake, the safest place to take cover is:",
                        "options": ["Under a sturdy desk or table", "In a doorway", "Near a window", "Under stairs"],
                        "correct": 0
                    },
                    {
                        "question": "How long should you hold your protective position during earthquake shaking?",
                        "options": ["Until counting to 10", "Until the shaking stops completely", "For exactly 30 seconds", "Until you hear the all-clear signal"],
                        "correct": 1
                    },
                    {
                        "question": "After an earthquake stops, you should:",
                        "options": ["Immediately run outside", "Check for injuries and hazards first", "Turn on all lights", "Use the phone to call everyone"],
                        "correct": 1
                    },
                    {
                        "question": "If you're driving during an earthquake, you should:",
                        "options": ["Speed up to get home quickly", "Stop immediately wherever you are", "Pull over safely and stay in the car", "Get out and lie on the ground"],
                        "correct": 2
                    }
                ]
            },
            {
                "title": "Flood Preparedness Quiz", 
                "module_id": created_modules[2].id,
                "questions": [
                    {
                        "question": "What is the most important rule about walking in flood water?",
                        "options": ["Only walk if water is clear", "Never walk in moving water", "Walk quickly to minimize exposure", "Always walk with a group"],
                        "correct": 1
                    },
                    {
                        "question": "How much moving water can knock down an adult?",
                        "options": ["12 inches", "6 inches", "18 inches", "24 inches"],
                        "correct": 1
                    },
                    {
                        "question": "If you encounter a flooded road while driving, you should:",
                        "options": ["Drive through quickly", "Test the depth slowly", "Turn around and find another route", "Wait for other cars to go first"],
                        "correct": 2
                    },
                    {
                        "question": "When preparing for a flood, which action should you take first?",
                        "options": ["Move to higher ground", "Gather important documents", "Fill bathtubs with water", "Board up windows"],
                        "correct": 0
                    },
                    {
                        "question": "After a flood, before entering your home you should:",
                        "options": ["Rush in to assess damage", "Check for structural damage and hazards", "Turn on electricity to see better", "Start cleaning immediately"],
                        "correct": 1
                    }
                ]
            },
            {
                "title": "Emergency Kits Quiz",
                "module_id": created_modules[3].id,
                "questions": [
                    {
                        "question": "How much water should you store per person per day in an emergency kit?",
                        "options": ["1/2 gallon", "1 gallon", "2 gallons", "3 gallons"],
                        "correct": 1
                    },
                    {
                        "question": "Emergency food supplies should last for at least:",
                        "options": ["24 hours", "48 hours", "72 hours (3 days)", "1 week"],
                        "correct": 2
                    },
                    {
                        "question": "Which of these is NOT essential in a basic emergency kit?",
                        "options": ["First aid kit", "Matches in waterproof container", "Laptop computer", "Battery-powered radio"],
                        "correct": 2
                    },
                    {
                        "question": "How often should you check and update your emergency kit?",
                        "options": ["Once a year", "Every 6 months", "Every 3 months", "Only when items expire"],
                        "correct": 1
                    },
                    {
                        "question": "The best location for your home emergency kit is:",
                        "options": ["In the basement", "In a cool, dry, easily accessible place", "In the garage", "In the attic"],
                        "correct": 1
                    }
                ]
            }
        ]
        
        for quiz in quiz_data:
            quiz_obj = Quiz(**quiz)
            await db.quizzes.insert_one(quiz_obj.dict())

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

# Module Routes
@api_router.get("/modules", response_model=List[Module])
async def get_modules(current_user: User = Depends(get_current_user)):
    modules = await db.modules.find().sort("order", 1).to_list(length=None)
    return [Module(**module) for module in modules]

@api_router.get("/modules/{module_id}", response_model=Module)
async def get_module(module_id: str, current_user: User = Depends(get_current_user)):
    module = await db.modules.find_one({"id": module_id})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return Module(**module)

# Video Completion Routes
@api_router.post("/video-completion", response_model=VideoCompletion)
async def mark_video_complete(completion: VideoCompletion, current_user: User = Depends(get_current_user)):
    completion.user_id = current_user.id
    
    # Check if already completed
    existing = await db.video_completions.find_one({
        "user_id": current_user.id,
        "module_id": completion.module_id
    })
    
    if existing:
        # Update existing completion
        await db.video_completions.update_one(
            {"user_id": current_user.id, "module_id": completion.module_id},
            {"$set": completion.dict()}
        )
    else:
        # Create new completion
        await db.video_completions.insert_one(completion.dict())
    
    return completion

@api_router.get("/video-completion/{module_id}")
async def get_video_completion(module_id: str, current_user: User = Depends(get_current_user)):
    completion = await db.video_completions.find_one({
        "user_id": current_user.id,
        "module_id": module_id
    })
    
    if completion:
        completion_obj = VideoCompletion(**completion)
        return {"completed": True, "completion": completion_obj}
    else:
        return {"completed": False, "completion": None}

# Quiz Routes
@api_router.get("/quizzes", response_model=List[Quiz])
async def get_quizzes(current_user: User = Depends(get_current_user)):
    quizzes = await db.quizzes.find().to_list(length=None)
    return [Quiz(**quiz) for quiz in quizzes]

@api_router.get("/quizzes/module/{module_id}", response_model=List[Quiz])
async def get_module_quizzes(module_id: str, current_user: User = Depends(get_current_user)):
    quizzes = await db.quizzes.find({"module_id": module_id}).to_list(length=None)
    return [Quiz(**quiz) for quiz in quizzes]

# New Quiz Management Routes for Teachers
class QuizCreate(BaseModel):
    title: str
    module_id: Optional[str] = None  # None for standalone quizzes
    questions: List[dict]

@api_router.post("/teacher/quizzes", response_model=Quiz)
async def create_quiz(quiz_data: QuizCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    quiz = Quiz(
        title=quiz_data.title,
        module_id=quiz_data.module_id or "",
        questions=quiz_data.questions
    )
    # Add created_by field to track who created the quiz
    quiz_dict = quiz.dict()
    quiz_dict["created_by"] = current_user.id
    
    await db.quizzes.insert_one(quiz_dict)
    return quiz

@api_router.get("/teacher/quizzes", response_model=List[Quiz])
async def get_teacher_quizzes(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get quizzes created by current teacher or all if admin
    if current_user.role == "admin":
        quizzes = await db.quizzes.find().to_list(length=None)
    else:
        quizzes = await db.quizzes.find({"created_by": current_user.id}).to_list(length=None)
    
    return [Quiz(**quiz) for quiz in quizzes]

@api_router.put("/teacher/quizzes/{quiz_id}", response_model=Quiz)
async def update_quiz(quiz_id: str, quiz_data: QuizCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if quiz exists and user has permission
    existing_quiz = await db.quizzes.find_one({"id": quiz_id})
    if not existing_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if current_user.role == "teacher" and existing_quiz.get("created_by") != current_user.id:
        raise HTTPException(status_code=403, detail="Can only edit your own quizzes")
    
    # Update quiz
    updated_quiz = Quiz(
        id=quiz_id,
        title=quiz_data.title,
        module_id=quiz_data.module_id or "",
        questions=quiz_data.questions
    )
    
    quiz_dict = updated_quiz.dict()
    quiz_dict["created_by"] = existing_quiz.get("created_by", current_user.id)
    quiz_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.quizzes.update_one({"id": quiz_id}, {"$set": quiz_dict})
    return updated_quiz

@api_router.delete("/teacher/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if quiz exists and user has permission
    existing_quiz = await db.quizzes.find_one({"id": quiz_id})
    if not existing_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if current_user.role == "teacher" and existing_quiz.get("created_by") != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own quizzes")
    
    await db.quizzes.delete_one({"id": quiz_id})
    return {"message": "Quiz deleted successfully"}

@api_router.post("/quiz-attempts", response_model=QuizAttempt)
async def submit_quiz(attempt: QuizAttempt, current_user: User = Depends(get_current_user)):
    attempt.user_id = current_user.id
    await db.quiz_attempts.insert_one(attempt.dict())
    return attempt

@api_router.get("/quiz-attempts/{user_id}", response_model=List[QuizAttempt])
async def get_quiz_attempts(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "teacher" and current_user.id != user_id:
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
    # Allow both admins and teachers to create alerts
    if current_user.role not in ["admin", "teacher"]:
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

# Enhanced User Stats Route
@api_router.get("/user-stats/{user_id}")
async def get_user_stats(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "teacher" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get quiz attempts
    quiz_attempts = await db.quiz_attempts.find({"user_id": user_id}).to_list(length=None)
    total_quizzes = len(quiz_attempts)
    total_points = sum(attempt["score"] for attempt in quiz_attempts)
    
    # Get drill participations
    drill_participations = await db.drill_participations.find({"user_id": user_id}).to_list(length=None)
    total_drills = len(drill_participations)
    
    # Get video completions
    video_completions = await db.video_completions.find({"user_id": user_id}).to_list(length=None)
    completed_modules = len(video_completions)
    
    # Get module progress
    modules = await db.modules.find().sort("order", 1).to_list(length=None)
    module_progress = []
    
    for module in modules:
        # Check video completion
        video_completed = await db.video_completions.find_one({
            "user_id": user_id, 
            "module_id": module["id"]
        })
        
        # Check quiz attempts for this module
        quiz_attempt = await db.quiz_attempts.find_one({
            "user_id": user_id,
            "module_id": module["id"]
        })
        
        module_progress.append({
            "module_id": module["id"],
            "module_title": module["title"],
            "video_completed": video_completed is not None,
            "video_completed_at": video_completed["completed_at"] if video_completed else None,
            "quiz_completed": quiz_attempt is not None,
            "quiz_score": quiz_attempt["score"] if quiz_attempt else 0,
            "quiz_total": quiz_attempt["total_questions"] if quiz_attempt else 0,
            "quiz_completed_at": quiz_attempt["completed_at"] if quiz_attempt else None
        })
    
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
        "completed_modules": completed_modules,
        "total_modules": len(modules),
        "module_progress": module_progress,
        "recent_quiz_attempts": recent_quiz_attempts,
        "recent_drill_participations": recent_drill_participations
    }

# Teacher Dashboard - All Students Progress with Ranking
@api_router.get("/teacher/students-progress")
async def get_all_students_progress(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all students
    students = await db.users.find({"role": "student"}).to_list(length=None)
    
    students_progress = []
    for student in students:
        # Get student stats
        stats = await get_user_stats(student["id"], current_user)
        
        # Calculate completion speed score (modules completed / days since account creation)
        days_since_creation = max(1, (datetime.now(timezone.utc) - student["created_at"]).days)
        completion_speed = stats["completed_modules"] / days_since_creation
        
        # Calculate overall score (points + completion speed bonus)
        overall_score = stats["total_points"] + (completion_speed * 10)
        
        students_progress.append({
            "student_id": student["id"],
            "student_name": student["full_name"],
            "student_username": student["username"],
            "total_points": stats["total_points"],
            "completed_modules": stats["completed_modules"],
            "total_modules": stats["total_modules"],
            "total_quizzes": stats["total_quizzes_completed"],
            "completion_speed": round(completion_speed, 2),
            "overall_score": round(overall_score, 1),
            "module_progress": stats["module_progress"]
        })
    
    # Sort by overall score for ranking
    students_progress.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add rank to each student
    for i, student in enumerate(students_progress):
        student["rank"] = i + 1
    
    # Calculate class statistics
    total_students = len(students_progress)
    if total_students > 0:
        avg_points = sum(s["total_points"] for s in students_progress) / total_students
        avg_modules = sum(s["completed_modules"] for s in students_progress) / total_students
        avg_quizzes = sum(s["total_quizzes"] for s in students_progress) / total_students
        avg_score = sum(s["overall_score"] for s in students_progress) / total_students
    else:
        avg_points = avg_modules = avg_quizzes = avg_score = 0
    
    return {
        "students_progress": students_progress,
        "class_statistics": {
            "total_students": total_students,
            "average_points": round(avg_points, 1),
            "average_modules_completed": round(avg_modules, 1),
            "average_quizzes_completed": round(avg_quizzes, 1),
            "average_overall_score": round(avg_score, 1)
        }
    }

# Student Leaderboard Route
@api_router.get("/leaderboard")
async def get_student_leaderboard(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher", "student"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all students
    students = await db.users.find({"role": "student"}).to_list(length=None)
    
    leaderboard = []
    for student in students:
        # Get student stats
        stats = await get_user_stats(student["id"], current_user)
        
        # Calculate completion speed score
        days_since_creation = max(1, (datetime.now(timezone.utc) - student["created_at"]).days)
        completion_speed = stats["completed_modules"] / days_since_creation
        
        # Calculate overall score
        overall_score = stats["total_points"] + (completion_speed * 10)
        
        leaderboard.append({
            "student_id": student["id"],
            "student_name": student["full_name"],
            "student_username": student["username"],
            "total_points": stats["total_points"],
            "completed_modules": stats["completed_modules"],
            "total_modules": stats["total_modules"],
            "total_quizzes": stats["total_quizzes_completed"],
            "overall_score": round(overall_score, 1),
            "completion_speed": round(completion_speed, 2)
        })
    
    # Sort by overall score
    leaderboard.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add rank
    for i, student in enumerate(leaderboard):
        student["rank"] = i + 1
    
    # Return top 10 for leaderboard display
    return {
        "leaderboard": leaderboard[:10],
        "total_students": len(leaderboard),
        "current_user_rank": next((s["rank"] for s in leaderboard if s["student_id"] == current_user.id), None) if current_user.role == "student" else None
    }

# Teacher Progress Tracking for Admin
@api_router.get("/admin/teachers-progress")
async def get_teachers_progress(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all teachers
    teachers = await db.users.find({"role": "teacher"}).to_list(length=None)
    
    teachers_progress = []
    for teacher in teachers:
        # Get quizzes created by teacher
        created_quizzes = await db.quizzes.find({"created_by": teacher["id"]}).to_list(length=None)
        
        # Get alerts created by teacher
        created_alerts = await db.alerts.find({"created_by": teacher["id"]}).to_list(length=None)
        
        teachers_progress.append({
            "teacher_id": teacher["id"],
            "teacher_name": teacher["full_name"],
            "teacher_username": teacher["username"],
            "created_quizzes": len(created_quizzes),
            "created_alerts": len(created_alerts),
            "account_created": teacher["created_at"],
            "recent_activity": {
                "recent_quizzes": [{"title": q["title"], "created_at": q["created_at"]} for q in created_quizzes[-3:]],
                "recent_alerts": [{"title": a["title"], "created_at": a["created_at"]} for a in created_alerts[-3:]]
            }
        })
    
    return {
        "teachers_progress": teachers_progress,
        "total_teachers": len(teachers_progress)
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