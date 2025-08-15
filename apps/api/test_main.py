import pytest
from fastapi.testclient import TestClient
from main import app, Place, calculate_distance, tsp_nearest_neighbor

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "trailwright-api"}

def test_calculate_distance():
    # Distance between NYC and LA (approximately)
    nyc_lat, nyc_lng = 40.7128, -74.0060
    la_lat, la_lng = 34.0522, -118.2437
    
    distance = calculate_distance(nyc_lat, nyc_lng, la_lat, la_lng)
    # Should be approximately 3944 km
    assert 3900 < distance < 4000

def test_tsp_nearest_neighbor():
    places = [
        Place(id="1", lat=0, lng=0),
        Place(id="2", lat=1, lng=1),
        Place(id="3", lat=0, lng=2),
        Place(id="4", lat=2, lng=0),
    ]
    
    tour = tsp_nearest_neighbor(places)
    assert len(tour) == 4
    assert tour[0] == "1"  # Should start with first place
    assert all(place_id in tour for place_id in ["1", "2", "3", "4"])

def test_optimize_day_single_place():
    response = client.post("/optimize-day", json={
        "places": [{"id": "1", "lat": 0, "lng": 0}],
        "travel_mode": "DRIVING"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["order"] == ["1"]
    assert data["total_distance"] == 0
    assert data["total_duration"] == 0

def test_optimize_day_multiple_places():
    response = client.post("/optimize-day", json={
        "places": [
            {"id": "1", "lat": 0, "lng": 0},
            {"id": "2", "lat": 1, "lng": 1},
            {"id": "3", "lat": 0, "lng": 2}
        ],
        "travel_mode": "DRIVING"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["order"]) == 3
    assert data["total_distance"] > 0
    assert data["total_duration"] > 0

def test_import_kml():
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
            <Placemark>
                <name>Test Place</name>
                <description>A test location</description>
                <Point>
                    <coordinates>-122.4194,37.7749,0</coordinates>
                </Point>
            </Placemark>
        </Document>
    </kml>"""
    
    response = client.post("/import/kml", json={
        "file_content": kml_content,
        "file_type": "kml"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["places"]) == 1
    assert data["places"][0]["name"] == "Test Place"
    assert data["places"][0]["lat"] == 37.7749
    assert data["places"][0]["lng"] == -122.4194

def test_import_gpx():
    gpx_content = """<?xml version="1.0" encoding="UTF-8"?>
    <gpx version="1.1">
        <wpt lat="37.7749" lon="-122.4194">
            <name>San Francisco</name>
            <desc>City by the bay</desc>
        </wpt>
    </gpx>"""
    
    response = client.post("/import/gpx", json={
        "file_content": gpx_content,
        "file_type": "gpx"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["places"]) == 1
    assert data["places"][0]["name"] == "San Francisco"
    assert data["places"][0]["lat"] == 37.7749
    assert data["places"][0]["lng"] == -122.4194