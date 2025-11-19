# Flask imports - web framework for creating the API server
from flask import Flask, request, jsonify
# CORS - allows frontend (running on different port) to make requests to this backend
from flask_cors import CORS
# requests - library for making HTTP requests to external APIs (Open-Meteo)
import requests
# os - for accessing environment variables
import os
# quote - safely encodes city names for URLs (handles special characters)
from urllib.parse import quote

# Create Flask application instance
app = Flask(__name__)
# Enable CORS to allow frontend to connect (cross-origin resource sharing)
CORS(app)

# Get port from environment variable, default to 3000 if not set
PORT = int(os.environ.get('PORT', 3000))


def geocode_city(city):
    """
    Helper: call Open-Meteo geocoding to get lat/lon for a city name
    Handles both city names and full location strings (e.g., "City, State, Country")
    """
    # Try with the full string first, but request more results for better matching
    # quote() safely encodes the city name for URL (handles spaces, special chars)
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(city)}&count=10&language=en&format=json"
    
    try:
        # Make HTTP GET request to Open-Meteo Geocoding API
        res = requests.get(url)
        # Raise an exception if HTTP status code indicates an error (4xx, 5xx)
        res.raise_for_status()
        # Parse JSON response into Python dictionary
        j = res.json()
        
        # Check if API returned any results
        if not j.get('results') or len(j['results']) == 0:
            # If full string fails, try extracting just the city name (before first comma)
            # This handles cases like "London, England, UK" -> "London"
            city_only = city.split(',')[0].strip()
            if city_only != city:
                # Retry with just the city name
                url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(city_only)}&count=10&language=en&format=json"
                res = requests.get(url)
                res.raise_for_status()
                j = res.json()
                
                # If still no results, return None (city not found)
                if not j.get('results') or len(j['results']) == 0:
                    return None
        
        # If we have results, try to find the best match
        results = j.get('results', [])
        if not results:
            return None
        
        # Parse query to extract city, state, and country
        city_parts = [part.strip() for part in city.split(',')]
        primary_city = city_parts[0].lower() if city_parts else ''
        state_query = city_parts[1].lower() if len(city_parts) > 1 else None
        country_query = city_parts[2].lower() if len(city_parts) > 2 else None
        
        # Score-based matching: prefer results that match state and country
        best_match = None
        best_score = -1
        
        for r in results:
            result_name = r.get('name', '').lower()
            result_state = r.get('admin1', '').lower()
            result_country = r.get('country', '').lower()
            
            # Skip if city name doesn't match
            if result_name != primary_city:
                continue
            
            # Calculate match score (higher is better)
            score = 0
            if result_name == primary_city:
                score += 1
            
            # Prefer matches with state if state was provided
            if state_query and result_state:
                if state_query in result_state or result_state in state_query:
                    score += 2
                elif result_state:  # State exists but doesn't match
                    score -= 1
            
            # Prefer matches with country if country was provided
            if country_query and result_country:
                if country_query in result_country or result_country in country_query:
                    score += 2
                elif result_country:  # Country exists but doesn't match
                    score -= 1
            
            # Update best match if this one scores higher
            if score > best_score:
                best_score = score
                best_match = r
        
        # If no match found with scoring, use the first result (Open-Meteo sorts by relevance)
        if not best_match:
            best_match = results[0]
        
        # Return structured location data with coordinates and timezone
        return {
            'name': best_match['name'],
            'country': best_match['country'],
            'latitude': best_match['latitude'],   # Needed for weather API
            'longitude': best_match['longitude'],  # Needed for weather API
            'timezone': best_match.get('timezone', 'auto')  # Default to 'auto' if not provided
        }
    except requests.exceptions.RequestException as e:
        # Re-raise as a more descriptive exception if API call fails
        raise Exception(f"Geocoding error: {e}")


def fetch_weather(lat, lon, timezone="auto", days=7):
    """
    Helper: call Open-Meteo forecast / current weather
    Fetches all available weather data including humidity, pressure, cloud cover, wind, UV index, etc.
    """
    # Validate required parameters
    if lat is None or lon is None:
        raise Exception("Latitude and longitude are required")
    
    # Build parameters for Open-Meteo Forecast API
    # Request current weather + hourly + daily forecasts with all available parameters
    params = {
        'latitude': lat,   # Required: latitude coordinate
        'longitude': lon,   # Required: longitude coordinate
        'timezone': timezone,  # Timezone for the location (or 'auto' to detect)
        'current_weather': 'true',  # Include current weather conditions
        # Hourly forecast parameters (comma-separated list)
        'hourly': 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,pressure_msl,cloudcover,windspeed_10m,winddirection_10m,uv_index,is_day',
        # Daily forecast parameters (comma-separated list)
        'daily': 'temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,precipitation_sum,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,uv_index_max,precipitation_probability_max',
        'forecast_days': str(days)  # Number of days to forecast (default: 7)
    }
    
    # Open-Meteo Forecast API endpoint (no API key required!)
    url = f"https://api.open-meteo.com/v1/forecast"
    
    try:
        # Make HTTP GET request with parameters
        res = requests.get(url, params=params, timeout=10)
        # Raise exception if HTTP error occurred
        res.raise_for_status()
        
        # Parse JSON response
        data = res.json()
        
        # Validate response contains expected data
        if not data:
            raise Exception("Empty response from weather API")
        
        # Check for error in response (Open-Meteo sometimes returns errors in JSON)
        if 'error' in data:
            error_msg = data.get('reason', 'Unknown error from weather API')
            raise Exception(f"Weather API error: {error_msg}")
        
        # Validate that we have at least current weather or forecast data
        if 'current_weather' not in data and 'hourly' not in data and 'daily' not in data:
            raise Exception("Invalid response from weather API: missing weather data")
        
        return data
    except requests.exceptions.Timeout:
        raise Exception("Weather API request timed out. Please try again later.")
    except requests.exceptions.RequestException as e:
        # Re-raise as a more descriptive exception if API call fails
        raise Exception(f"Weather API error: {e}")
    except ValueError as e:
        # JSON parsing error
        raise Exception(f"Invalid response from weather API: {e}")


@app.route('/search-cities', methods=['GET'])
def search_cities():
    """
    Endpoint: /search-cities?q=query&limit=5
    
    Provides city autocomplete/search functionality.
    Used by frontend to show city suggestions as user types.
    
    Query parameters:
        q: Search query (e.g., "lon" for London)
        limit: Maximum number of results (default: 5)
    
    Returns: JSON with list of city suggestions
    """
    try:
        # Get query parameter from URL, default to empty string if not provided
        query = (request.args.get('q') or '').strip()
        # Get limit parameter, default to 5 if not provided
        limit = int(request.args.get('limit', 5))
        
        # If no query provided, return empty suggestions list
        if not query:
            return jsonify({'suggestions': []})
        
        # Build URL for Open-Meteo Geocoding API
        # quote() safely encodes the query string for URL
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(query)}&count={limit}&language=en&format=json"
        
        # Make API request
        res = requests.get(url)
        res.raise_for_status()
        j = res.json()
        
        # Process results and format for frontend
        suggestions = []
        if j.get('results'):
            for r in j['results']:
                city_name = r.get('name', '')
                state = r.get('admin1', '')  # Open-Meteo uses 'admin1' for state/province
                country = r.get('country', '')
                
                # Build display name: "City, State, Country"
                display_name = city_name
                if state:
                    display_name += f', {state}'
                display_name += f', {country}'
                
                # Add formatted suggestion to list
                suggestions.append({
                    'name': city_name,
                    'state': state,
                    'country': country,
                    'display_name': display_name,  # Full formatted name for display
                    'lat': r.get('latitude'),      # Latitude for weather lookup
                    'lon': r.get('longitude')       # Longitude for weather lookup
                })
        
        # Return JSON response with suggestions
        return jsonify({'suggestions': suggestions})
    
    except Exception as err:
        # Log error for debugging
        print(f"Error: {err}")
        # Return error response with 500 status code (server error)
        return jsonify({'error': str(err) or 'internal error'}), 500


@app.route('/weather', methods=['GET'])
def weather():
    """
    Endpoint: /weather?city=CityName
    
    Main weather endpoint that returns comprehensive weather data for a city.
    
    Query parameters:
        city: City name (e.g., "London" or "New York, NY, USA")
    
    Returns: JSON with current weather, hourly forecast, and daily forecast
    
    Process:
        1. Convert city name to coordinates (geocoding)
        2. Fetch weather data using coordinates
        3. Format and return structured response
    """
    try:
        # Get city parameter from URL, strip whitespace
        city = (request.args.get('city') or '').strip()
        
        # Validate input - return error if city not provided
        if not city:
            return jsonify({'error': 'Please provide ?city=CityName'}), 400
        
        # Step 1: Convert city name to coordinates using geocoding API
        geo = geocode_city(city)
        if not geo:
            # City not found - return 404 error
            return jsonify({'error': f'City not found: {city}'}), 404
        
        # Step 2: Fetch weather data using coordinates
        # Pass latitude, longitude, timezone, and forecast days (10 days)
        weather_data = fetch_weather(geo['latitude'], geo['longitude'], geo['timezone'], 10)
        
        # Step 3: Extract and structure the response data
        hourly_data = weather_data.get('hourly', {})
        daily_data = weather_data.get('daily', {})
        
        # Build structured response object
        out = {
            # Location information
            'location': {
                'query': city,                    # Original user query
                'resolved_name': geo['name'],     # Actual city name from API
                'country': geo['country'],         # Country name
                'latitude': geo['latitude'],       # Latitude coordinate
                'longitude': geo['longitude'],     # Longitude coordinate
                'timezone': geo['timezone']       # Timezone for the location
            },
            # Current weather conditions
            'current': weather_data.get('current_weather'),
            # Hourly forecast data (arrays of values for each hour)
            'hourly': {
                'time': hourly_data.get('time', []),                          # Timestamps
                'temperature_2m': hourly_data.get('temperature_2m', []),      # Temperature in °C
                'relativehumidity_2m': hourly_data.get('relativehumidity_2m', []),  # Humidity %
                'apparent_temperature': hourly_data.get('apparent_temperature', []),  # Feels-like temp
                'precipitation': hourly_data.get('precipitation', []),         # Precipitation mm
                'weathercode': hourly_data.get('weathercode', []),            # Weather condition code
                'pressure_msl': hourly_data.get('pressure_msl', []),          # Atmospheric pressure
                'cloudcover': hourly_data.get('cloudcover', []),              # Cloud cover %
                'windspeed_10m': hourly_data.get('windspeed_10m', []),         # Wind speed km/h
                'winddirection_10m': hourly_data.get('winddirection_10m', []), # Wind direction degrees
                'uv_index': hourly_data.get('uv_index', []),                  # UV index
                'is_day': hourly_data.get('is_day', [])                        # 1=day, 0=night
            },
            # Daily forecast data (arrays of values for each day)
            'daily': {
                'time': daily_data.get('time', []),                            # Dates
                'temperature_2m_max': daily_data.get('temperature_2m_max', []),  # Max temp °C
                'temperature_2m_min': daily_data.get('temperature_2m_min', []),  # Min temp °C
                'weathercode': daily_data.get('weathercode', []),              # Weather condition code
                'sunrise': daily_data.get('sunrise', []),                      # Sunrise times
                'sunset': daily_data.get('sunset', []),                        # Sunset times
                'precipitation_sum': daily_data.get('precipitation_sum', []),  # Total precipitation mm
                'windspeed_10m_max': daily_data.get('windspeed_10m_max', []), # Max wind speed km/h
                'windgusts_10m_max': daily_data.get('windgusts_10m_max', []), # Max wind gusts km/h
                'winddirection_10m_dominant': daily_data.get('winddirection_10m_dominant', []),  # Dominant wind direction
                'uv_index_max': daily_data.get('uv_index_max', []),           # Max UV index
                'precipitation_probability_max': daily_data.get('precipitation_probability_max', [])  # Max precipitation probability %
            },
            'source': 'open-meteo.com'  # Data source attribution
        }
        
        # Return JSON response
        return jsonify(out)
    
    except Exception as err:
        # Log error for debugging
        print(f"Error: {err}")
        # Return error response with 500 status code (server error)
        return jsonify({'error': str(err) or 'internal error'}), 500


# Entry point - only runs when script is executed directly (not when imported)
if __name__ == '__main__':
    print(f'Weather API running on http://localhost:{PORT}')
    # Start Flask development server
    # debug=True enables auto-reload on code changes and detailed error pages
    app.run(debug=True, port=PORT)
