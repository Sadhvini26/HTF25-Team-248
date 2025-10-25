import io
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
from torchvision import transforms
from transformers import AutoImageProcessor, AutoModelForImageClassification
from datetime import datetime
from typing import List, Dict
import base64

# Load model
processor = AutoImageProcessor.from_pretrained("eslamxm/vit-base-food101")
model = AutoModelForImageClassification.from_pretrained("eslamxm/vit-base-food101")
model.eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing; adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Transform function
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# In-memory storage for meal history (use database in production)
meal_history: List[Dict] = []

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    # Preprocess
    inputs = processor(images=img, return_tensors="pt").to(device)
    
    # Model prediction
    with torch.no_grad():
        outputs = model(**inputs)
        pred = outputs.logits.argmax(-1).item()
    
    # Map prediction to class name
    class_name = model.config.id2label[pred]
    
    # Convert image to base64 for storage
    buffered = io.BytesIO()
    img.thumbnail((200, 200))  # Resize for storage
    img.save(buffered, format="JPEG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "prediction": class_name,
        "image": img_base64,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/save-meal")
async def save_meal(meal_data: dict):
    """Save meal to history"""
    meal_entry = {
        "id": len(meal_history) + 1,
        "food_name": meal_data.get("food_name"),
        "calories": meal_data.get("calories"),
        "protein": meal_data.get("protein", 0),
        "carbs": meal_data.get("carbs", 0),
        "fat": meal_data.get("fat", 0),
        "image": meal_data.get("image"),
        "timestamp": meal_data.get("timestamp", datetime.now().isoformat()),
        "date": datetime.fromisoformat(meal_data.get("timestamp", datetime.now().isoformat())).strftime("%Y-%m-%d")
    }
    meal_history.append(meal_entry)
    return {"message": "Meal saved successfully", "meal_id": meal_entry["id"]}

@app.get("/meal-history")
async def get_meal_history(date: str = None):
    """Get meal history, optionally filtered by date"""
    if date:
        filtered = [m for m in meal_history if m["date"] == date]
        return {"meals": filtered}
    return {"meals": meal_history}

@app.get("/daily-summary")
async def get_daily_summary(date: str = None):
    """Get daily nutritional summary"""
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    daily_meals = [m for m in meal_history if m["date"] == target_date]
    
    total_calories = sum(m.get("calories", 0) for m in daily_meals)
    total_protein = sum(m.get("protein", 0) for m in daily_meals)
    total_carbs = sum(m.get("carbs", 0) for m in daily_meals)
    total_fat = sum(m.get("fat", 0) for m in daily_meals)
    
    return {
        "date": target_date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fat": total_fat,
        "meal_count": len(daily_meals)
    }

@app.delete("/meal/{meal_id}")
async def delete_meal(meal_id: int):
    """Delete a meal from history"""
    global meal_history
    meal_history = [m for m in meal_history if m["id"] != meal_id]
    return {"message": "Meal deleted successfully"}