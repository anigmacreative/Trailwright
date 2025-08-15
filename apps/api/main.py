from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import httpx
import json
from dotenv import load_dotenv
import numpy as np
from supabase import create_client, Client
import uuid

load_dotenv()

app = FastAPI(
    title="Trailwright API",
    description="Backend service for trip optimization and AI assistance",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://trailwright.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

security = HTTPBearer()

# Models
class Place(BaseModel):
    id: str
    lat: float
    lng: float
    name: Optional[str] = None

class OptimizeDayRequest(BaseModel):
    places: List[Place]
    travel_mode: str = Field(default="DRIVING", pattern="^(DRIVING|WALKING|TRANSIT|BICYCLING)$")

class OptimizeDayResponse(BaseModel):
    order: List[str]
    distances: List[float]
    durations: List[int]
    total_distance: float
    total_duration: int

class GenerateDayPlanRequest(BaseModel):
    city: str
    interests: List[str]
    hours: int = Field(default=8, ge=1, le=24)
    travel_mode: str = Field(default="DRIVING", pattern="^(DRIVING|WALKING|TRANSIT|BICYCLING)$")
    trip_id: str
    day_id: Optional[str] = None

class POISuggestion(BaseModel):
    name: str
    description: str
    category: str
    estimated_duration: int
    lat: Optional[float] = None
    lng: Optional[float] = None
    google_place_id: Optional[str] = None

class GenerateDayPlanResponse(BaseModel):
    suggestions: List[POISuggestion]
    reasoning: str

class ImportRequest(BaseModel):
    file_content: str
    file_type: str = Field(pattern="^(kml|gpx)$")

class ImportedPlace(BaseModel):
    name: str
    lat: float
    lng: float
    description: Optional[str] = None

class ImportResponse(BaseModel):
    places: List[ImportedPlace]

# Utility functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate haversine distance between two points in kilometers"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    delta_lat = np.radians(lat2 - lat1)
    delta_lng = np.radians(lng2 - lng1)
    
    a = (np.sin(delta_lat / 2) ** 2 + 
         np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(delta_lng / 2) ** 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    
    return R * c

def tsp_nearest_neighbor(places: List[Place]) -> List[str]:
    """Simple nearest neighbor heuristic for TSP"""
    if len(places) <= 1:
        return [place.id for place in places]
    
    unvisited = places[1:]  # Skip first place as starting point
    tour = [places[0].id]
    current = places[0]
    
    while unvisited:
        nearest_idx = 0
        nearest_dist = float('inf')
        
        for i, place in enumerate(unvisited):
            dist = calculate_distance(current.lat, current.lng, place.lat, place.lng)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = i
        
        nearest = unvisited.pop(nearest_idx)
        tour.append(nearest.id)
        current = nearest
    
    return tour

def two_opt_improve(places: List[Place], tour: List[str]) -> List[str]:
    """Apply 2-opt improvement to tour"""
    improved = True
    best_tour = tour[:]
    place_dict = {p.id: p for p in places}
    
    def tour_distance(t):
        total = 0
        for i in range(len(t)):
            j = (i + 1) % len(t)
            p1, p2 = place_dict[t[i]], place_dict[t[j]]
            total += calculate_distance(p1.lat, p1.lng, p2.lat, p2.lng)
        return total
    
    best_distance = tour_distance(best_tour)
    
    while improved:
        improved = False
        for i in range(1, len(tour) - 2):
            for j in range(i + 1, len(tour)):
                if j - i == 1:
                    continue
                
                new_tour = tour[:i] + tour[i:j+1][::-1] + tour[j+1:]
                new_distance = tour_distance(new_tour)
                
                if new_distance < best_distance:
                    best_tour = new_tour
                    best_distance = new_distance
                    improved = True
                    break
            if improved:
                break
        tour = best_tour[:]
    
    return best_tour

async def get_ai_response(prompt: str) -> str:
    """Get response from AI provider"""
    ai_provider = os.getenv("AI_PROVIDER", "anthropic").lower()
    
    if ai_provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Anthropic API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "content-type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": prompt}]
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="AI service error")
            
            result = response.json()
            return result["content"][0]["text"]
    
    elif ai_provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1000
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="AI service error")
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    else:
        raise HTTPException(status_code=500, detail="Unsupported AI provider")

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "trailwright-api"}

@app.post("/optimize-day", response_model=OptimizeDayResponse)
async def optimize_day(request: OptimizeDayRequest):
    """Optimize the order of places for a day using TSP heuristics"""
    if len(request.places) <= 1:
        return OptimizeDayResponse(
            order=[p.id for p in request.places],
            distances=[],
            durations=[],
            total_distance=0,
            total_duration=0
        )
    
    # Apply nearest neighbor + 2-opt
    initial_tour = tsp_nearest_neighbor(request.places)
    optimized_tour = two_opt_improve(request.places, initial_tour)
    
    # Calculate distances and durations
    place_dict = {p.id: p for p in request.places}
    distances = []
    durations = []
    total_distance = 0
    total_duration = 0
    
    for i in range(len(optimized_tour)):
        j = (i + 1) % len(optimized_tour)
        p1 = place_dict[optimized_tour[i]]
        p2 = place_dict[optimized_tour[j]]
        
        dist = calculate_distance(p1.lat, p1.lng, p2.lat, p2.lng)
        # Rough duration estimate (km/h based on travel mode)
        speed = {"WALKING": 5, "BICYCLING": 15, "DRIVING": 50, "TRANSIT": 30}
        duration = int((dist / speed.get(request.travel_mode, 50)) * 60)  # minutes
        
        distances.append(dist)
        durations.append(duration)
        total_distance += dist
        total_duration += duration
    
    return OptimizeDayResponse(
        order=optimized_tour,
        distances=distances[:-1],  # Remove last segment (back to start)
        durations=durations[:-1],
        total_distance=total_distance,
        total_duration=total_duration
    )

@app.post("/ai/generate-day-plan", response_model=GenerateDayPlanResponse)
async def generate_day_plan(request: GenerateDayPlanRequest):
    """Generate AI-powered day plan suggestions"""
    interests_str = ", ".join(request.interests)
    
    prompt = f"""Create a {request.hours}-hour itinerary for {request.city} focusing on {interests_str}.
    
    Travel mode: {request.travel_mode}
    
    Provide 6-8 points of interest with:
    - Name and brief description
    - Category (food, sights, nature, culture, adventure, etc.)
    - Estimated time to spend (in minutes)
    - Logical order considering travel time
    
    Format as JSON:
    {{
        "suggestions": [
            {{
                "name": "Place Name",
                "description": "Brief description",
                "category": "category",
                "estimated_duration": 120
            }}
        ],
        "reasoning": "Brief explanation of the itinerary flow"
    }}"""
    
    try:
        ai_response = await get_ai_response(prompt)
        
        # Parse JSON from AI response
        # Find JSON block in response
        start = ai_response.find('{')
        end = ai_response.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in AI response")
        
        json_str = ai_response[start:end]
        parsed = json.loads(json_str)
        
        # Store suggestion in database
        suggestion_id = str(uuid.uuid4())
        supabase.table("ai_suggestions").insert({
            "id": suggestion_id,
            "trip_id": request.trip_id,
            "day_id": request.day_id,
            "prompt": prompt,
            "result": parsed,
            "created_by": "system"  # Would be user_id in real app
        }).execute()
        
        return GenerateDayPlanResponse(**parsed)
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/import/kml", response_model=ImportResponse)
async def import_kml(request: ImportRequest):
    """Import places from KML file"""
    try:
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(request.file_content, 'xml')
        places = []
        
        # Parse KML placemarks
        for placemark in soup.find_all('Placemark'):
            name_elem = placemark.find('name')
            desc_elem = placemark.find('description')
            coords_elem = placemark.find('coordinates')
            
            if coords_elem and name_elem:
                coords_text = coords_elem.get_text().strip()
                # KML format: longitude,latitude,altitude
                coords = coords_text.split(',')
                if len(coords) >= 2:
                    places.append(ImportedPlace(
                        name=name_elem.get_text().strip(),
                        lat=float(coords[1]),
                        lng=float(coords[0]),
                        description=desc_elem.get_text().strip() if desc_elem else None
                    ))
        
        return ImportResponse(places=places)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"KML parsing failed: {str(e)}")

@app.post("/import/gpx", response_model=ImportResponse)
async def import_gpx(request: ImportRequest):
    """Import places from GPX file"""
    try:
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(request.file_content, 'xml')
        places = []
        
        # Parse GPX waypoints
        for waypoint in soup.find_all('wpt'):
            name_elem = waypoint.find('name')
            desc_elem = waypoint.find('desc')
            
            if name_elem and waypoint.get('lat') and waypoint.get('lon'):
                places.append(ImportedPlace(
                    name=name_elem.get_text().strip(),
                    lat=float(waypoint.get('lat')),
                    lng=float(waypoint.get('lon')),
                    description=desc_elem.get_text().strip() if desc_elem else None
                ))
        
        return ImportResponse(places=places)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GPX parsing failed: {str(e)}")

@app.post("/export/pdf")
async def export_pdf(trip_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Generate PDF export for trip"""
    # TODO: Implement PDF generation using reportlab or wkhtmltopdf
    # This is a placeholder for the PDF export functionality
    raise HTTPException(status_code=501, detail="PDF export not yet implemented")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))