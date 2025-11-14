from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    theme: str = "system"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    theme: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class Ingredient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    unit: str
    price: float

class IngredientCreate(BaseModel):
    name: str
    unit: str
    price: float

class RecipeIngredient(BaseModel):
    ingredientId: str
    quantity: float

class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    imageUrl: Optional[str] = None
    description: str = ""
    laborCost: float = 0
    markup: float = 0
    ingredients: List[RecipeIngredient] = []

class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    laborCost: float = 0
    markup: float = 0
    ingredients: List[RecipeIngredient] = []

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    clientId: str
    client: dict
    item: str
    dueDate: str
    total: float
    status: str = "New"
    notes: Optional[str] = ""
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    clientId: str
    item: str
    dueDate: str
    total: float
    notes: Optional[str] = ""

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    clientId: Optional[str] = None
    item: Optional[str] = None
    dueDate: Optional[str] = None
    total: Optional[float] = None
    notes: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth routes
@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email
    )
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_obj = User(**user)
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/me", response_model=User)
async def update_me(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    update_dict = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.users.update_one({"id": current_user.id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    return User(**updated_user)

@api_router.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    # Save file
    file_extension = file.filename.split(".")[-1]
    filename = f"avatar_{current_user.id}.{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user avatar
    avatar_url = f"/uploads/{filename}"
    await db.users.update_one({"id": current_user.id}, {"$set": {"avatar": avatar_url}})
    
    return {"avatarUrl": avatar_url}

@api_router.post("/upload/recipe")
async def upload_recipe_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    file_extension = file.filename.split(".")[-1]
    filename = f"recipe_{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"imageUrl": f"/uploads/{filename}"}

# Clients routes
@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return clients

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client = Client(userId=current_user.id, **client_data.model_dump())
    await db.clients.insert_one(client.model_dump())
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"id": client_id, "userId": current_user.id},
        {"$set": client_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

# Ingredients routes
@api_router.get("/ingredients", response_model=List[Ingredient])
async def get_ingredients(current_user: User = Depends(get_current_user)):
    ingredients = await db.ingredients.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return ingredients

@api_router.post("/ingredients", response_model=Ingredient)
async def create_ingredient(ingredient_data: IngredientCreate, current_user: User = Depends(get_current_user)):
    ingredient = Ingredient(userId=current_user.id, **ingredient_data.model_dump())
    await db.ingredients.insert_one(ingredient.model_dump())
    return ingredient

@api_router.put("/ingredients/{ingredient_id}", response_model=Ingredient)
async def update_ingredient(ingredient_id: str, ingredient_data: IngredientCreate, current_user: User = Depends(get_current_user)):
    result = await db.ingredients.update_one(
        {"id": ingredient_id, "userId": current_user.id},
        {"$set": ingredient_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    updated_ingredient = await db.ingredients.find_one({"id": ingredient_id}, {"_id": 0})
    return Ingredient(**updated_ingredient)

@api_router.delete("/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: str, current_user: User = Depends(get_current_user)):
    result = await db.ingredients.delete_one({"id": ingredient_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return {"message": "Ingredient deleted"}

# Recipes routes
@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(current_user: User = Depends(get_current_user)):
    recipes = await db.recipes.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    return recipes

@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate, current_user: User = Depends(get_current_user)):
    recipe = Recipe(userId=current_user.id, **recipe_data.model_dump())
    await db.recipes.insert_one(recipe.model_dump())
    return recipe

@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, recipe_data: RecipeCreate, current_user: User = Depends(get_current_user)):
    result = await db.recipes.update_one(
        {"id": recipe_id, "userId": current_user.id},
        {"$set": recipe_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    updated_recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    return Recipe(**updated_recipe)

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, current_user: User = Depends(get_current_user)):
    result = await db.recipes.delete_one({"id": recipe_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted"}

@api_router.get("/recipes/{recipe_id}/calculate")
async def calculate_recipe_cost(recipe_id: str, current_user: User = Depends(get_current_user)):
    recipe = await db.recipes.find_one({"id": recipe_id, "userId": current_user.id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Calculate cost
    total_cost = 0
    for recipe_ing in recipe.get("ingredients", []):
        ingredient = await db.ingredients.find_one(
            {"id": recipe_ing["ingredientId"], "userId": current_user.id},
            {"_id": 0}
        )
        if ingredient:
            total_cost += ingredient["price"] * recipe_ing["quantity"]
    
    labor_cost = recipe.get("laborCost", 0)
    markup = recipe.get("markup", 0)
    
    final_price = (total_cost + labor_cost) * (1 + markup / 100)
    
    return {
        "recipeCost": total_cost,
        "laborCost": labor_cost,
        "totalCost": total_cost + labor_cost,
        "markup": markup,
        "finalPrice": final_price
    }

# Orders routes
@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    # Sort by dueDate
    orders.sort(key=lambda x: x.get("dueDate", ""), reverse=True)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Get client info
    client = await db.clients.find_one({"id": order_data.clientId, "userId": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    order = Order(
        userId=current_user.id,
        client={"id": client["id"], "name": client["name"]},
        **order_data.model_dump()
    )
    await db.orders.insert_one(order.model_dump())
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate, current_user: User = Depends(get_current_user)):
    update_dict = {k: v for k, v in order_data.model_dump().items() if v is not None}
    
    # If clientId is updated, update client info
    if "clientId" in update_dict:
        client = await db.clients.find_one(
            {"id": update_dict["clientId"], "userId": current_user.id},
            {"_id": 0}
        )
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        update_dict["client"] = {"id": client["id"], "name": client["name"]}
    
    result = await db.orders.update_one(
        {"id": order_id, "userId": current_user.id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**updated_order)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: User = Depends(get_current_user)):
    result = await db.orders.delete_one({"id": order_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# Dashboard stats
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(period: str = "month", current_user: User = Depends(get_current_user)):
    # Calculate date range
    now = datetime.now(timezone.utc)
    
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    start_date_str = start_date.isoformat()
    
    # Get all orders
    orders = await db.orders.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Calculate total revenue (delivered orders in period)
    total_revenue = sum(
        order["total"] for order in orders
        if order["status"] == "Delivered" and order.get("createdAt", "") >= start_date_str
    )
    
    # Active orders
    active_orders = sum(
        1 for order in orders
        if order["status"] in ["New", "In Progress"]
    )
    
    # Recent activities (new orders in last week)
    week_ago = (now - timedelta(days=7)).isoformat()
    recent_activities = sum(
        1 for order in orders
        if order.get("createdAt", "") >= week_ago
    )
    
    # Get clients stats
    clients = await db.clients.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    month_ago = (now - timedelta(days=30)).isoformat()
    new_clients = sum(1 for client in clients if client.get("createdAt", "") >= month_ago)
    
    # Upcoming orders (next 5)
    upcoming_orders = [
        order for order in orders
        if order["status"] not in ["Delivered", "Cancelled"]
    ]
    upcoming_orders.sort(key=lambda x: x.get("dueDate", ""))
    upcoming_orders = upcoming_orders[:5]
    
    return {
        "totalRevenue": total_revenue,
        "totalClients": len(clients),
        "newClients": new_clients,
        "activeOrders": active_orders,
        "recentActivities": recent_activities,
        "upcomingOrders": upcoming_orders
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()