import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [calories, setCalories] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  
  // New states for meal tracking
  const [mealHistory, setMealHistory] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState("upload"); // upload, history, trends
  const [loading, setLoading] = useState(false);

  const SPOONACULAR_API_KEY = "your_api_key_here" // replace with your key

  useEffect(() => {
    if (activeTab === "history") {
      loadMealHistory();
      loadDailySummary();
    }
  }, [activeTab, selectedDate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1️⃣ Get food prediction from backend
      const res = await axios.post("http://localhost:8000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const foodName = res.data.prediction;
      const imageBase64 = res.data.image;
      const timestamp = res.data.timestamp;
      
      setPrediction(foodName);
      setCurrentImage(imageBase64);

      // 2️⃣ Get calories from Spoonacular API
      const calRes = await axios.get(
        `https://api.spoonacular.com/food/ingredients/search?query=${foodName}&apiKey=${SPOONACULAR_API_KEY}`
      );

      if (calRes.data.results && calRes.data.results.length > 0) {
        const id = calRes.data.results[0].id;

        // Get nutrition info for the ingredient
        const nutriRes = await axios.get(
          `https://api.spoonacular.com/food/ingredients/${id}/information?amount=100&unit=g&apiKey=${SPOONACULAR_API_KEY}`
        );

        const nutrients = nutriRes.data.nutrition.nutrients;
        const cal = nutrients.find((n) => n.name === "Calories");
        const protein = nutrients.find((n) => n.name === "Protein");
        const carbs = nutrients.find((n) => n.name === "Carbohydrates");
        const fat = nutrients.find((n) => n.name === "Fat");
        
        const nutritionInfo = {
          calories: cal ? cal.amount : 0,
          protein: protein ? protein.amount : 0,
          carbs: carbs ? carbs.amount : 0,
          fat: fat ? fat.amount : 0
        };
        
        setCalories(nutritionInfo.calories);
        setNutritionData(nutritionInfo);
        
        // Auto-save to meal history
        await saveMealToHistory(foodName, nutritionInfo, imageBase64, timestamp);
      } else {
        setCalories("Unknown");
        setNutritionData(null);
      }
    } catch (err) {
      console.error(err);
      setPrediction("Error predicting image.");
      setCalories("");
      setNutritionData(null);
    } finally {
      setLoading(false);
    }
  };

  const saveMealToHistory = async (foodName, nutrition, image, timestamp) => {
    try {
      await axios.post("http://localhost:8000/save-meal", {
        food_name: foodName,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        image: image,
        timestamp: timestamp
      });
    } catch (err) {
      console.error("Error saving meal:", err);
    }
  };

  const loadMealHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/meal-history?date=${selectedDate}`);
      setMealHistory(res.data.meals);
    } catch (err) {
      console.error("Error loading meal history:", err);
    }
  };

  const loadDailySummary = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/daily-summary?date=${selectedDate}`);
      setDailySummary(res.data);
    } catch (err) {
      console.error("Error loading daily summary:", err);
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      await axios.delete(`http://localhost:8000/meal/${mealId}`);
      loadMealHistory();
      loadDailySummary();
    } catch (err) {
      console.error("Error deleting meal:", err);
    }
  };

  const captureFromCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handleFileChange(e);
    input.click();
  };

  return (
    <div className="container">
      <h1>🍽️ FoodVision - Smart Calorie Tracker</h1>
      <p className="subtitle">Simplify your diet management with AI-powered food recognition</p>
      
      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={activeTab === "upload" ? "tab active" : "tab"}
          onClick={() => setActiveTab("upload")}
        >
          📸 Scan Food
        </button>
        <button 
          className={activeTab === "history" ? "tab active" : "tab"}
          onClick={() => setActiveTab("history")}
        >
          📊 Meal History
        </button>
        <button 
          className={activeTab === "trends" ? "tab active" : "tab"}
          onClick={() => setActiveTab("trends")}
        >
          📈 Trends
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="upload-section">
          <form onSubmit={handleSubmit}>
            <div className="upload-buttons">
              <input 
                type="file" 
                id="fileInput"
                onChange={handleFileChange} 
                style={{display: 'none'}}
                accept="image/*"
              />
              <button 
                type="button" 
                className="btn-upload"
                onClick={() => document.getElementById('fileInput').click()}
              >
                📁 Upload Image
              </button>
              <button 
                type="button" 
                className="btn-camera"
                onClick={captureFromCamera}
              >
                📷 Capture Photo
              </button>
            </div>
            
            {previewImage && (
              <div className="preview">
                <img src={previewImage} alt="Preview" />
              </div>
            )}
            
            <button type="submit" className="btn-predict" disabled={!file || loading}>
              {loading ? "Analyzing..." : "🔍 Analyze Food"}
            </button>
          </form>
          
          {prediction && (
            <div className="prediction">
              <h2>Analysis Results</h2>
              {currentImage && (
                <img src={`data:image/jpeg;base64,${currentImage}`} alt="Detected food" className="result-image" />
              )}
              <div className="nutrition-card">
                <h3>🍴 {prediction}</h3>
                <div className="nutrition-grid">
                  <div className="nutrition-item">
                    <span className="label">Calories</span>
                    <span className="value">{calories} kcal</span>
                  </div>
                  {nutritionData && (
                    <>
                      <div className="nutrition-item">
                        <span className="label">Protein</span>
                        <span className="value">{nutritionData.protein}g</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="label">Carbs</span>
                        <span className="value">{nutritionData.carbs}g</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="label">Fat</span>
                        <span className="value">{nutritionData.fat}g</span>
                      </div>
                    </>
                  )}
                </div>
                <p className="note">✅ Automatically saved to your meal log</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="history-section">
          <div className="date-picker">
            <label>Select Date: </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {dailySummary && (
            <div className="daily-summary">
              <h2>Daily Summary - {selectedDate}</h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Total Calories</span>
                  <span className="value">{dailySummary.total_calories} kcal</span>
                </div>
                <div className="summary-item">
                  <span className="label">Protein</span>
                  <span className="value">{dailySummary.total_protein}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Carbs</span>
                  <span className="value">{dailySummary.total_carbs}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Fat</span>
                  <span className="value">{dailySummary.total_fat}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Meals</span>
                  <span className="value">{dailySummary.meal_count}</span>
                </div>
              </div>
            </div>
          )}

          <div className="meal-list">
            <h3>Meals on {selectedDate}</h3>
            {mealHistory.length === 0 ? (
              <p className="no-meals">No meals logged for this date</p>
            ) : (
              mealHistory.map((meal) => (
                <div key={meal.id} className="meal-card">
                  <img 
                    src={`data:image/jpeg;base64,${meal.image}`} 
                    alt={meal.food_name}
                    className="meal-thumbnail"
                  />
                  <div className="meal-info">
                    <h4>{meal.food_name}</h4>
                    <p className="meal-time">
                      {new Date(meal.timestamp).toLocaleTimeString()}
                    </p>
                    <div className="meal-nutrition">
                      <span>{meal.calories} kcal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>
                  </div>
                  <button 
                    className="btn-delete"
                    onClick={() => deleteMeal(meal.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="trends-section">
          <h2>Nutritional Trends</h2>
          <p className="coming-soon">📊 Weekly and monthly trend visualizations coming soon!</p>
          <div className="tips">
            <h3>💡 Healthy Eating Tips:</h3>
            <ul>
              <li>Track your meals consistently for better insights</li>
              <li>Aim for balanced macros: protein, carbs, and healthy fats</li>
              <li>Stay hydrated throughout the day</li>
              <li>Focus on whole, unprocessed foods</li>
              <li>Listen to your body's hunger cues</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;