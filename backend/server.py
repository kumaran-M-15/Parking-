from fastapi import FastAPI, APIRouter, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import json
import tempfile
import io
import random
import string

# Import our SQLite database
from database import db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# FIXED: Add CORS middleware RIGHT AFTER creating the app (BEFORE the router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class VehicleType(str, Enum):
    BIKE = "bike"
    CAR = "car"

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WAITLIST = "waitlist"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class ParkingDurationType(str, Enum):
    SINGLE_DAY = "single_day"
    DATE_RANGE = "date_range"
    RECURRING = "recurring"

# Models
class Office(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    total_car_slots: int
    total_bike_slots: int
    available_car_slots: int
    available_bike_slots: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfficeCreate(BaseModel):
    name: str
    location: str
    total_car_slots: int
    total_bike_slots: int

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    emp_id: str
    name: str
    email: str
    phone: str
    team: Optional[str] = None
    shift: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    emp_id: str
    name: str
    email: str
    phone: str
    team: Optional[str] = None
    shift: Optional[str] = None

class ParkingRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    office_id: str
    vehicle_type: VehicleType
    vehicle_number: str
    duration_type: ParkingDurationType
    parking_date: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    recurring_pattern: Optional[str] = None
    description: Optional[str] = None
    status: RequestStatus = RequestStatus.PENDING
    slot_number: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ParkingRequestCreate(BaseModel):
    emp_id: str
    name: str
    email: str
    phone: str
    team: Optional[str] = None
    shift: Optional[str] = None
    office_id: str = "default-office"  # FIXED: Added default office ID
    vehicle_type: VehicleType
    vehicle_number: str
    duration_type: ParkingDurationType = ParkingDurationType.SINGLE_DAY  # FIXED: Added default
    parking_date: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    recurring_pattern: Optional[str] = None
    description: Optional[str] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminApproval(BaseModel):
    request_id: str
    status: RequestStatus
    rejection_reason: Optional[str] = None

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class UserStatusRequest(BaseModel):
    email: str
    otp: str

# OTP Storage
otp_storage = {}

# Helper functions for OTP
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

async def send_otp_email(email: str, otp: str):
    # Simulate email sending
    print(f"OTP for {email}: {otp}")  # In production, remove this line
    return True

# FIXED: Proper admin credentials with case-insensitive email matching
ADMIN_CREDENTIALS = {
    "admin@parkingsystem.com": "admin123",
    "superadmin@parkingsystem.com": "super123"
}

# FIXED: Initialize default office on startup - IMPROVED VERSION
def initialize_default_office():
    try:
        # Check if ANY office exists (not just default-office)
        offices = db.execute_query("SELECT * FROM offices LIMIT 1")
        if not offices:
            # Create default office
            office_data = {
                "id": "default-office",
                "name": "Main Office",
                "location": "Chennai",
                "total_car_slots": 50,
                "total_bike_slots": 100,
                "available_car_slots": 50,
                "available_bike_slots": 100,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            query = """
            INSERT INTO offices (id, name, location, total_car_slots, total_bike_slots, 
                                available_car_slots, available_bike_slots, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            params = (
                office_data["id"], office_data["name"], office_data["location"],
                office_data["total_car_slots"], office_data["total_bike_slots"],
                office_data["available_car_slots"], office_data["available_bike_slots"],
                office_data["created_at"]
            )
            
            db.execute_update(query, params)
            print("✅ Default office created successfully!")
        else:
            print("✅ Offices already exist in database")
            
            # If default-office doesn't exist but other offices do, create it
            default_office = db.execute_query("SELECT * FROM offices WHERE id = 'default-office'")
            if not default_office:
                # Use the first available office as default
                first_office = offices[0]
                print(f"⚠️ Using existing office as default: {first_office['name']}")
                
    except Exception as e:
        print(f"❌ Error creating default office: {e}")

# FIXED: Function to get or create default office
def get_or_create_default_office():
    try:
        # First try to get default-office
        office = db.execute_query("SELECT * FROM offices WHERE id = 'default-office'")
        if office:
            return office[0]
        
        # If default-office doesn't exist, get any office
        offices = db.execute_query("SELECT * FROM offices LIMIT 1")
        if offices:
            return offices[0]
        
        # If no offices exist, create default office
        initialize_default_office()
        office = db.execute_query("SELECT * FROM offices WHERE id = 'default-office'")
        if office:
            return office[0]
        
        return None
    except Exception as e:
        print(f"Error getting default office: {e}")
        return None

# API Routes with SQLite implementation
@api_router.get("/")
async def root():
    return {"message": "Parking Management System API"}

# OTP Endpoints
@api_router.post("/send-otp")
async def send_otp(request: OTPRequest):
    try:
        otp = generate_otp()
        otp_storage[request.email] = {
            'otp': otp,
            'expires_at': datetime.now(timezone.utc) + timedelta(minutes=10)
        }
        
        await send_otp_email(request.email, otp)
        
        return {"message": f"OTP sent to {request.email}", "otp": otp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@api_router.post("/verify-otp")
async def verify_otp(request: OTPVerify):
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP not found or expired")
    
    if datetime.now(timezone.utc) > stored_otp['expires_at']:
        del otp_storage[request.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored_otp['otp'] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    del otp_storage[request.email]
    return {"message": "OTP verified successfully"}

# Office Management
@api_router.post("/offices", response_model=Office)
async def create_office(office: OfficeCreate):
    office_dict = office.dict()
    office_dict["id"] = str(uuid.uuid4())
    office_dict["available_car_slots"] = office_dict["total_car_slots"]
    office_dict["available_bike_slots"] = office_dict["total_bike_slots"]
    office_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    query = """
    INSERT INTO offices (id, name, location, total_car_slots, total_bike_slots, 
                        available_car_slots, available_bike_slots, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        office_dict["id"], office_dict["name"], office_dict["location"],
        office_dict["total_car_slots"], office_dict["total_bike_slots"],
        office_dict["available_car_slots"], office_dict["available_bike_slots"],
        office_dict["created_at"]
    )
    
    db.execute_update(query, params)
    return Office(**office_dict)

@api_router.get("/offices", response_model=List[Office])
async def get_offices():
    query = "SELECT * FROM offices"
    offices = db.execute_query(query)
    return [Office(**office) for office in offices]

# FIXED: Parking Request Management - COMPLETELY REWRITTEN
@api_router.post("/parking-requests", response_model=ParkingRequest)
async def create_parking_request(request: ParkingRequestCreate):
    print(f"🚗 Received parking request: {request.dict()}")  # Debug log
    
    try:
        # FIXED: Get or create default office
        office = get_or_create_default_office()
        if not office:
            # If still no office, create one immediately
            initialize_default_office()
            office = get_or_create_default_office()
            if not office:
                raise HTTPException(status_code=500, detail="No office available and could not create one")
        
        print(f"🏢 Using office: {office['name']} (ID: {office['id']})")
        
        # Update the request with the actual office ID
        actual_office_id = office['id']
        
        # Create or find user
        user = db.execute_query("SELECT * FROM users WHERE emp_id = ?", (request.emp_id,))
        if not user:
            user_data = UserCreate(
                emp_id=request.emp_id,
                name=request.name,
                email=request.email,
                phone=request.phone,
                team=request.team,
                shift=request.shift
            )
            user_obj = User(**user_data.dict())
            user_dict = user_obj.dict()
            user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
            
            query = """
            INSERT INTO users (id, emp_id, name, email, phone, team, shift, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            params = (
                user_dict["id"], user_dict["emp_id"], user_dict["name"],
                user_dict["email"], user_dict["phone"], user_dict["team"],
                user_dict["shift"], user_dict["role"], user_dict["created_at"]
            )
            db.execute_update(query, params)
            user_id = user_obj.id
            print(f"👤 Created new user: {request.name}")
        else:
            user_id = user[0]["id"]
            print(f"👤 Found existing user: {user[0]['name']}")
        
        # Check availability
        vehicle_slot_field = f"available_{request.vehicle_type}_slots"
        available_slots = office.get(vehicle_slot_field, 0)
        
        parking_request_dict = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "office_id": actual_office_id,  # Use actual office ID
            "vehicle_type": request.vehicle_type,
            "vehicle_number": request.vehicle_number,
            "duration_type": request.duration_type,
            "parking_date": request.parking_date,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "recurring_pattern": request.recurring_pattern,
            "description": request.description,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if available_slots <= 0:
            parking_request_dict["status"] = RequestStatus.WAITLIST
            print("⚠️ No slots available - added to waitlist")
        else:
            print(f"✅ Slots available: {available_slots}")
        
        query = """
        INSERT INTO parking_requests 
        (id, user_id, office_id, vehicle_type, vehicle_number, duration_type, 
         parking_date, start_date, end_date, recurring_pattern, description, 
         status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            parking_request_dict["id"], parking_request_dict["user_id"],
            parking_request_dict["office_id"], parking_request_dict["vehicle_type"],
            parking_request_dict["vehicle_number"], parking_request_dict["duration_type"],
            parking_request_dict["parking_date"], parking_request_dict["start_date"],
            parking_request_dict["end_date"], parking_request_dict["recurring_pattern"],
            parking_request_dict["description"], parking_request_dict["status"],
            parking_request_dict["created_at"], parking_request_dict["updated_at"]
        )
        
        db.execute_update(query, params)
        print("✅ Parking request saved to database")
        
        # Return success response
        response_data = ParkingRequest(**parking_request_dict)
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating parking request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create parking request: {str(e)}")

@api_router.get("/parking-requests", response_model=List[dict])
async def get_parking_requests(status: Optional[str] = None):
    if status:
        query = "SELECT * FROM parking_requests WHERE status = ?"
        requests = db.execute_query(query, (status,))
    else:
        query = "SELECT * FROM parking_requests"
        requests = db.execute_query(query)
    
    # Populate with user and office data
    enriched_requests = []
    for req in requests:
        user = db.execute_query("SELECT * FROM users WHERE id = ?", (req["user_id"],))
        office = db.execute_query("SELECT * FROM offices WHERE id = ?", (req["office_id"],))
        
        enriched_request = dict(req)
        enriched_request["user_name"] = user[0]["name"] if user else "Unknown"
        enriched_request["user_email"] = user[0]["email"] if user else "Unknown"
        enriched_request["office_name"] = office[0]["name"] if office else "Unknown"
        enriched_requests.append(enriched_request)
    
    return enriched_requests

@api_router.get("/parking-requests/user/{emp_id}")
async def get_user_requests_by_emp_id(emp_id: str):
    user = db.execute_query("SELECT * FROM users WHERE emp_id = ?", (emp_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    requests = db.execute_query("SELECT * FROM parking_requests WHERE user_id = ?", (user[0]["id"],))
    
    # Populate with office data
    enriched_requests = []
    for req in requests:
        office = db.execute_query("SELECT * FROM offices WHERE id = ?", (req["office_id"],))
        enriched_request = dict(req)
        enriched_request["office_name"] = office[0]["name"] if office else "Unknown"
        enriched_requests.append(enriched_request)
    
    return enriched_requests

# FIXED: Admin Authentication - Improved with better error handling
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    # Normalize email to lowercase for case-insensitive matching
    email_lower = credentials.email.lower().strip()
    
    # Check if email exists in credentials
    if email_lower not in [email.lower() for email in ADMIN_CREDENTIALS.keys()]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Find the actual key (case-insensitive match)
    actual_email = next((email for email in ADMIN_CREDENTIALS.keys() if email.lower() == email_lower), None)
    
    if not actual_email or ADMIN_CREDENTIALS[actual_email] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Determine role based on email
    role = "super_admin" if "super" in actual_email.lower() else "admin"
    
    return {
        "message": "Login successful",
        "success": True,
        "email": actual_email,
        "role": role,
        "token": f"admin-token-{uuid.uuid4()}"  # Simple token for session management
    }

# Admin Operations
@api_router.post("/admin/approve-request")
async def approve_reject_request(approval: AdminApproval):
    request_doc = db.execute_query("SELECT * FROM parking_requests WHERE id = ?", (approval.request_id,))
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request_data = request_doc[0]
    update_data = {
        "status": approval.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if approval.status == RequestStatus.APPROVED:
        # Assign slot and reduce availability
        office = db.execute_query("SELECT * FROM offices WHERE id = ?", (request_data["office_id"],))
        vehicle_type = request_data["vehicle_type"]
        office_data = office[0]
        
        if vehicle_type == VehicleType.CAR:
            slot_number = f"C-{office_data['total_car_slots'] - office_data['available_car_slots'] + 1}"
            db.execute_update(
                "UPDATE offices SET available_car_slots = available_car_slots - 1 WHERE id = ?",
                (request_data["office_id"],)
            )
        else:
            slot_number = f"B-{office_data['total_bike_slots'] - office_data['available_bike_slots'] + 1}"
            db.execute_update(
                "UPDATE offices SET available_bike_slots = available_bike_slots - 1 WHERE id = ?",
                (request_data["office_id"],)
            )
        
        update_data["slot_number"] = slot_number
        update_data["approved_by"] = "admin"
    
    elif approval.status == RequestStatus.REJECTED:
        update_data["rejection_reason"] = approval.rejection_reason
    
    # Build update query
    set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
    query = f"UPDATE parking_requests SET {set_clause} WHERE id = ?"
    params = tuple(update_data.values()) + (approval.request_id,)
    
    db.execute_update(query, params)
    
    return {"message": f"Request {approval.status} successfully"}

@api_router.get("/admin/dashboard")
async def get_admin_dashboard():
    # Get counts by status
    pending_count = len(db.execute_query("SELECT * FROM parking_requests WHERE status = 'pending'"))
    approved_count = len(db.execute_query("SELECT * FROM parking_requests WHERE status = 'approved'"))
    rejected_count = len(db.execute_query("SELECT * FROM parking_requests WHERE status = 'rejected'"))
    waitlist_count = len(db.execute_query("SELECT * FROM parking_requests WHERE status = 'waitlist'"))
    
    # Get office utilization
    offices = db.execute_query("SELECT * FROM offices")
    office_stats = []
    for office in offices:
        car_utilization = ((office["total_car_slots"] - office["available_car_slots"]) / office["total_car_slots"]) * 100 if office["total_car_slots"] > 0 else 0
        bike_utilization = ((office["total_bike_slots"] - office["available_bike_slots"]) / office["total_bike_slots"]) * 100 if office["total_bike_slots"] > 0 else 0
        
        office_stats.append({
            "office_name": office["name"],
            "car_utilization": round(car_utilization, 1),
            "bike_utilization": round(bike_utilization, 1),
            "available_car_slots": office["available_car_slots"],
            "available_bike_slots": office["available_bike_slots"]
        })
    
    return {
        "request_counts": {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "waitlist": waitlist_count
        },
        "office_stats": office_stats
    }

# Include the router in the main app (AFTER CORS configuration)
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize default office when app starts
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Parking Management System...")
    initialize_default_office()
    print("✅ Startup completed!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
