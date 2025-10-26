# 🍽️ FoodVision - AI-Based Calorie & Dish Identifier


> **AI-Based Calorie & Dish Identifier**

FoodVision is an intelligent web application that leverages computer vision to automatically identify food items from images and provide detailed nutritional information. Say goodbye to manual calorie counting and hello to effortless meal tracking!



## ✨ Features

### 🔍 Core Functionality
- **AI-Powered Food Recognition**: Upload or capture food images for instant identification using Vision Transformer (ViT) model
- **Nutritional Analysis**: Get detailed breakdown of calories, protein, carbohydrates, and fats
- **Automatic Meal Logging**: All scanned meals are automatically saved with timestamps
- **Visual Meal History**: Browse your meals by date with thumbnail images
- **Daily Nutritional Summary**: Track your daily calorie intake and macro distribution
- **Multi-Device Support**: Works seamlessly on desktop and mobile devices

### 🎯 Key Benefits
- ⚡ **Fast**: Results in seconds
- 🎯 **Accurate**: Trained on 101 food categories
- 📱 **User-Friendly**: Intuitive interface with minimal steps
- 📊 **Comprehensive**: Complete nutritional breakdown
- 🔄 **Real-Time**: Instant feedback and analysis

---



## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling and responsive design

### Backend
- **FastAPI** - High-performance Python web framework
- **Python 3.8+** - Core programming language
- **Uvicorn** - ASGI server

### AI/ML
- **PyTorch** - Deep learning framework
- **Transformers (Hugging Face)** - Pre-trained models
- **Vision Transformer (ViT)** - Food classification model
- **Food101 Dataset** - Training data (101 food categories)
- **Pillow (PIL)** - Image processing

### APIs
- **Spoonacular API** - Nutritional data retrieval

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   User Device   │
│   (Browser)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   React Frontend│
│   - Image Upload│
│   - UI/UX       │
└────────┬────────┘
         │
         ↓ REST API
┌─────────────────┐
│   FastAPI       │
│   Backend       │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌──────────────┐
│ViT     │  │ Spoonacular  │
│Model   │  │ API          │
│(Food   │  │ (Nutrition)  │
│Recog)  │  │              │
└────────┘  └──────────────┘
    │              │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Meal Storage │
    │ (In-Memory)  │
    └──────────────┘
```

### Data Flow
1. User uploads/captures food image
2. Frontend sends image to FastAPI backend
3. Backend preprocesses image and feeds to ViT model
4. Model predicts food category
5. Backend queries Spoonacular API for nutrition data
6. Results returned to frontend and saved to meal history
7. User views nutritional breakdown and meal log

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8 or higher
- pip (Python package manager)
- npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/Sadhvini26/HTF25-Team-248
cd HTF25-Team-248
```

2. **Create virtual environment**
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. **Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
```

4. **Download the AI model** (automatically handled by Transformers library)
```python
# The model will be downloaded on first run
# eslamxm/vit-base-food101
```

5. **Start the FastAPI server**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd foodnet-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API settings**
- Open `src/App.js`
- Add your Spoonacular API key:
```javascript
const SPOONACULAR_API_KEY = "your_api_key_here"
```

4. **Start the development server**
```bash
npm start
```

Frontend will be running at `http://localhost:3000`

---

## 🚀 Usage

### Scanning Food

1. **Navigate to the "Scan Food" tab**
2. **Choose your input method**:
   - Click "📁 Upload Image" to select from your device
   - Click "📷 Capture Photo" to use your camera
3. **Click "🔍 Analyze Food"**
4. **View Results**:
   - Food name
   - Nutritional breakdown
   - Meal automatically saved to history

### Viewing Meal History

1. **Navigate to the "Meal History" tab**
2. **Select a date** using the date picker
3. **View**:
   - All meals for that date
   - Daily nutritional summary
   - Individual meal details
4. **Delete meals** by clicking the 🗑️ icon

### Tracking Trends

1. **Navigate to the "Trends" tab**
2. View healthy eating tips
3. *(Future feature: Weekly/monthly trend charts)*

---

## 📡 API Endpoints

### Backend (FastAPI)

#### `POST /predict`
Analyze food image and return prediction

**Request:**
- Body: `multipart/form-data`
- Field: `file` (image file)

**Response:**
```json
{
  "prediction": "pizza",
  "image": "base64_encoded_image",
  "timestamp": "2025-10-26T10:30:00"
}
```

#### `POST /save-meal`
Save meal to history

**Request:**
```json
{
  "food_name": "pizza",
  "calories": 266,
  "protein": 11,
  "carbs": 33,
  "fat": 10,
  "image": "base64_string",
  "timestamp": "2025-10-26T10:30:00"
}
```

**Response:**
```json
{
  "message": "Meal saved successfully",
  "meal_id": 1
}
```

#### `GET /meal-history?date={YYYY-MM-DD}`
Get meal history for specific date

**Response:**
```json
{
  "meals": [
    {
      "id": 1,
      "food_name": "pizza",
      "calories": 266,
      "protein": 11,
      "carbs": 33,
      "fat": 10,
      "image": "base64_string",
      "timestamp": "2025-10-26T10:30:00",
      "date": "2025-10-26"
    }
  ]
}
```

#### `GET /daily-summary?date={YYYY-MM-DD}`
Get daily nutritional summary

**Response:**
```json
{
  "date": "2025-10-26",
  "total_calories": 1850,
  "total_protein": 85,
  "total_carbs": 220,
  "total_fat": 65,
  "meal_count": 4
}
```

#### `DELETE /meal/{meal_id}`
Delete a meal from history

**Response:**
```json
{
  "message": "Meal deleted successfully"
}
```

---

## 📁 Project Structure

```
foodvision/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Styling
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── screenshots/               # App screenshots
├── docs/                      # Documentation
├── presentation/              # Project presentation
├── README.md                  # This file
└── LICENSE
```

---
## 🙏 Acknowledgments

- **Hugging Face** - For providing pre-trained models
- **Spoonacular** - For nutrition API
- **Food101 Dataset** - For training data
- **CBIT** - For organizing Hacktoberfest 2025
- All open-source contributors

---




**Made by Team 248 | CBIT Hacktoberfest 2025**
