from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from urllib.parse import quote

app = Flask(__name__)
CORS(app)  # Enable CORS to allow frontend to connect

PORT = int(os.environ.get('PORT', 3000))


def geocode_city(city):
    """
    Helper: call Open-Meteo geocoding to get lat/lon for a city name
    Handles both city names and full location strings (e.g., "City, State, Country")
    """
    # Try with the full string first, but request more results for better matching
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(city)}&count=10&language=en&format=json"
    
    try:
        res = requests.get(url)
        res.raise_for_status()
        j = res.json()
        
        if not j.get('results') or len(j['results']) == 0:
            # If full string fails, try extracting just the city name (before first comma)
            city_only = city.split(',')[0].strip()
            if city_only != city:
                # Retry with just the city name
                url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(city_only)}&count=10&language=en&format=json"
                res = requests.get(url)
                res.raise_for_status()
                j = res.json()
                
                if not j.get('results') or len(j['results']) == 0:
                    return None
        
        # If we have results, try to find the best match
        results = j.get('results', [])
        if not results:
            return None
        
        # Prefer exact matches or matches that contain the city name
        # First, try to find a result where the name matches the first part of the query
        city_parts = city.split(',')
        primary_city = city_parts[0].strip().lower()
        
        # Look for best match
        best_match = None
        for r in results:
            result_name = r.get('name', '').lower()
            # If the result name matches the primary city name, prefer it
            if result_name == primary_city:
                best_match = r
                break
        
        # If no exact match, use the first result (highest relevance score)
        if not best_match:
            best_match = results[0]
        
        # returns {name, country, latitude, longitude, timezone}
        return {
            'name': best_match['name'],
            'country': best_match['country'],
            'latitude': best_match['latitude'],
            'longitude': best_match['longitude'],
            'timezone': best_match.get('timezone', 'auto')
        }
    except requests.exceptions.RequestException as e:
        raise Exception(f"Geocoding error: {e}")


def fetch_weather(lat, lon, timezone="auto", days=7):
    """
    Helper: call Open-Meteo forecast / current weather
    """
    # request current_weather + hourly + daily
    params = {
        'latitude': lat,
        'longitude': lon,
        'timezone': timezone,
        'current_weather': 'true',
        'hourly': 'temperature_2m,apparent_temperature,precipitation,weathercode',
        'daily': 'temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset',
        'forecast_days': str(days)
    }
    
    url = f"https://api.open-meteo.com/v1/forecast"
    
    try:
        res = requests.get(url, params=params)
        res.raise_for_status()
        return res.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Weather API error: {e}")


@app.route('/search-cities', methods=['GET'])
def search_cities():
    """
    Endpoint: /search-cities?q=query&limit=5
    """
    try:
        query = (request.args.get('q') or '').strip()
        limit = int(request.args.get('limit', 5))
        
        if not query:
            return jsonify({'suggestions': []})
        
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(query)}&count={limit}&language=en&format=json"
        
        res = requests.get(url)
        res.raise_for_status()
        j = res.json()
        
        suggestions = []
        if j.get('results'):
            for r in j['results']:
                city_name = r.get('name', '')
                state = r.get('admin1', '')  # Open-Meteo uses 'admin1' for state
                country = r.get('country', '')
                
                display_name = city_name
                if state:
                    display_name += f', {state}'
                display_name += f', {country}'
                
                suggestions.append({
                    'name': city_name,
                    'state': state,
                    'country': country,
                    'display_name': display_name,
                    'lat': r.get('latitude'),
                    'lon': r.get('longitude')
                })
        
        return jsonify({'suggestions': suggestions})
    
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': str(err) or 'internal error'}), 500


@app.route('/weather', methods=['GET'])
def weather():
    """
    Endpoint: /weather?city=CityName
    """
    try:
        city = (request.args.get('city') or '').strip()
        
        if not city:
            return jsonify({'error': 'Please provide ?city=CityName'}), 400
        
        # 1) geocode
        geo = geocode_city(city)
        if not geo:
            return jsonify({'error': f'City not found: {city}'}), 404
        
        # 2) weather
        weather_data = fetch_weather(geo['latitude'], geo['longitude'], geo['timezone'], 7)
        
        # 3) shape response
        out = {
            'location': {
                'query': city,
                'resolved_name': geo['name'],
                'country': geo['country'],
                'latitude': geo['latitude'],
                'longitude': geo['longitude'],
                'timezone': geo['timezone']
            },
            'current': weather_data.get('current_weather'),
            'hourly': {
                'time': weather_data.get('hourly', {}).get('time', []),
                'temperature_2m': weather_data.get('hourly', {}).get('temperature_2m', []),
                'apparent_temperature': weather_data.get('hourly', {}).get('apparent_temperature', []),
                'precipitation': weather_data.get('hourly', {}).get('precipitation', []),
                'weathercode': weather_data.get('hourly', {}).get('weathercode', [])
            },
            'daily': weather_data.get('daily'),
            'source': 'open-meteo.com'
        }
        
        return jsonify(out)
    
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'error': str(err) or 'internal error'}), 500


if __name__ == '__main__':
    print(f'Weather API running on http://localhost:{PORT}')
    app.run(debug=True, port=PORT)
