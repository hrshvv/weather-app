from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this script is located
BASE_DIR = Path(__file__).resolve().parent

# Try to load .env file from multiple possible locations
env_paths = [
    BASE_DIR / '.env',  # Same directory as this script
    Path('.env'),  # Current working directory
    Path('backend/.env'),  # If running from project root
]

env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
        env_loaded = True
        print(f'[OK] Loaded .env from: {env_path}')
        break

# Fallback: try loading without explicit path (searches current dir and parents)
if not env_loaded:
    load_dotenv(override=True)

app = Flask(__name__)
CORS(app)  # Enable CORS to allow Next.js to connect

# Get API key from environment variable
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'your-api-key-here')

# Debug: Print API key status (first 4 chars only for security)
if OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != 'your-api-key-here':
    print(f'[OK] API Key loaded successfully: {OPENWEATHER_API_KEY[:4]}...')
else:
    print('[WARNING] API Key not found! Using default placeholder.')
    print('          Make sure .env file exists in the backend directory with: OPENWEATHER_API_KEY=your-key')
OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'
GEOCODING_API_URL = 'http://api.openweathermap.org/geo/1.0/direct'
ONE_CALL_API_URL = 'https://api.openweathermap.org/data/3.0/onecall'

API_OFFERINGS = [
    {
        'id': 'current-forecast',
        'title': 'Current Weather & Forecasts',
        'description': 'Real-time conditions plus multi-scale forecasts and alerts.',
        'highlights': [
            'Minute-by-minute precipitation forecast for the next 60 minutes',
            '48-hour hourly forecast with temperature, humidity, and wind details',
            '8-day daily outlook with highs, lows, and sky conditions',
            'Real-time government weather alerts for severe conditions'
        ]
    },
    {
        'id': 'historical-timestamp',
        'title': 'Historical Point-in-Time Data',
        'description': 'Access precise conditions for any timestamp across decades.',
        'highlights': [
            'Weather archive spanning 46+ years',
            'Supports single timestamp lookups for forensics and validation',
            'Includes up to 4 days of future forecast data in the same call'
        ]
    },
    {
        'id': 'historical-daily',
        'title': 'Daily Aggregations & Long-Range Outlooks',
        'description': 'Summaries for climate analytics and planning.',
        'highlights': [
            'Daily aggregates (min, max, precipitation, etc.) covering 46+ years',
            'Forward-looking daily outlook up to 1.5 years',
            'Ideal for agritech, energy, and infrastructure planning'
        ]
    },
    {
        'id': 'weather-overview',
        'title': 'Human-Readable Weather Narratives',
        'description': "Concise overview of today's and tomorrow's weather.",
        'highlights': [
            'Auto-generated summaries tuned for newsletters or dashboards',
            'Covers key impacts like temperature swings, rain chances, and wind',
            'Localized phrasing for improved readability'
        ]
    },
    {
        'id': 'ai-assistant',
        'title': 'AI Weather Assistant',
        'description': 'Conversational access to data and recommendations.',
        'highlights': [
            'Natural-language responses for weather questions',
            'Actionable advice (what to wear, travel tips, safety)',
            'Backed by structured weather data for accuracy'
        ]
    }
]

def get_coordinates_from_city(city_name):
    """
    Helper function to get latitude and longitude from a city name using Geocoding API.
    Returns (lat, lon, city_info) or (None, None, None) if not found.
    """
    try:
        params = {
            'q': city_name,
            'limit': 1,
            'appid': OPENWEATHER_API_KEY
        }
        
        response = requests.get(GEOCODING_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data and len(data) > 0:
            location = data[0]
            return (
                location.get('lat'),
                location.get('lon'),
                {
                    'name': location.get('name', ''),
                    'state': location.get('state', ''),
                    'country': location.get('country', '')
                }
            )
        return None, None, None
    
    except requests.exceptions.RequestException as e:
        print(f'[ERROR] Geocoding API error: {str(e)}')
        return None, None, None
    except Exception as e:
        print(f'[ERROR] Unexpected error in geocoding: {str(e)}')
        return None, None, None

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information"""
    return jsonify({
        'message': 'Weather API Server',
        'status': 'running',
        'endpoints': {
            'get_weather': {
                'url': '/get-weather',
                'method': 'GET',
                'parameters': {
                    'by_city': '?city=London',
                    'by_coordinates': '?lat=51.5074&lon=-0.1278'
                },
                'example': 'http://127.0.0.1:5000/get-weather?city=London'
            },
            'get_forecast': {
                'url': '/get-forecast',
                'method': 'GET',
                'parameters': {
                    'by_city': '?city=London',
                    'by_coordinates': '?lat=51.5074&lon=-0.1278'
                },
                'description': 'Get 5-day weather forecast (uses One Call API 3.0)',
                'note': 'Requires One Call API 3.0 subscription (free tier available)',
                'example': 'http://127.0.0.1:5000/get-forecast?city=London'
            },
            'get_hourly': {
                'url': '/get-hourly',
                'method': 'GET',
                'parameters': {
                    'by_city': '?city=London',
                    'by_coordinates': '?lat=51.5074&lon=-0.1278'
                },
                'description': 'Get 24-hour hourly weather forecast (uses One Call API 3.0)',
                'note': 'Requires One Call API 3.0 subscription (free tier available)',
                'example': 'http://127.0.0.1:5000/get-hourly?city=London'
            },
            'search_cities': {
                'url': '/search-cities',
                'method': 'GET',
                'parameters': {
                    'q': '?q=lon&limit=5'
                },
                'description': 'Search for city suggestions',
                'example': 'http://127.0.0.1:5000/search-cities?q=lon&limit=5'
            },
            'health': {
                'url': '/health',
                'method': 'GET',
                'description': 'Health check endpoint'
            }
        }
    })


@app.route('/api-offerings', methods=['GET'])
def api_offerings():
    """
    Expose the catalog of API capabilities so the frontend can render them.
    """
    return jsonify({
        'offerings': API_OFFERINGS,
        'count': len(API_OFFERINGS)
    })

@app.route('/get-weather', methods=['GET'])
def get_weather():
    """
    Endpoint to get weather data for a city or coordinates.
    Usage: 
    - By city: http://127.0.0.1:5000/get-weather?city=London
    - By coordinates: http://127.0.0.1:5000/get-weather?lat=51.5074&lon=-0.1278
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    # Validate input - need either city OR both lat and lon
    if not city and (not lat or not lon):
        return jsonify({
            'error': 'Either city parameter or both lat and lon parameters are required',
            'examples': {
                'by_city': '/get-weather?city=London',
                'by_coordinates': '/get-weather?lat=51.5074&lon=-0.1278'
            }
        }), 400
    
    try:
        # Build request parameters
        params = {
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric'  # Get temperature in Celsius
        }
        
        # Use coordinates if provided, otherwise use city name
        if lat and lon:
            params['lat'] = lat
            params['lon'] = lon
        else:
            params['q'] = city
        
        response = requests.get(OPENWEATHER_BASE_URL, params=params)
        response.raise_for_status()  # Raise an error for bad status codes
        
        data = response.json()
        
        # Format the response with only the data we need
        weather_data = {
            'city': data['name'],
            'country': data['sys']['country'],
            'temperature': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'description': data['weather'][0]['description'].title(),
            'humidity': data['main']['humidity'],
            'wind_speed': data['wind']['speed'],
            'icon': data['weather'][0]['icon'],
            'pressure': data['main'].get('pressure', 0),
            'visibility': round(data.get('visibility', 0) / 1000, 1) if data.get('visibility') else None,  # Convert to km
            'sunrise': data['sys']['sunrise'],
            'sunset': data['sys']['sunset'],
            'timezone': data.get('timezone', 0)
        }
        
        return jsonify(weather_data)
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to fetch weather data: {str(e)}'}), 500
    except KeyError as e:
        return jsonify({'error': 'Unexpected response format from weather API'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/get-forecast', methods=['GET'])
def get_forecast():
    """
    Endpoint to get 8-day weather forecast for a city or coordinates using One Call API 3.0.
    Usage: 
    - By city: http://127.0.0.1:5000/get-forecast?city=London
    - By coordinates: http://127.0.0.1:5000/get-forecast?lat=51.5074&lon=-0.1278
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    city_info = None
    
    # Validate input - need either city OR both lat and lon
    if not city and (not lat or not lon):
        return jsonify({
            'error': 'Either city parameter or both lat and lon parameters are required',
            'examples': {
                'by_city': '/get-forecast?city=London',
                'by_coordinates': '/get-forecast?lat=51.5074&lon=-0.1278'
            }
        }), 400
    
    try:
        # Step A: If city name provided, get coordinates using Geocoding API
        if city and (not lat or not lon):
            lat, lon, city_info = get_coordinates_from_city(city)
            if not lat or not lon:
                return jsonify({
                    'error': f'Could not find coordinates for city: {city}'
                }), 404
        
        # Step B: Use One Call API with lat and lon
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',  # Get temperature in Celsius
            'exclude': 'current,minutely,hourly,alerts'  # We only need daily forecast
        }
        
        response = requests.get(ONE_CALL_API_URL, params=params)
        response.raise_for_status()  # Raise an error for bad status codes
        
        data = response.json()
        
        # Process daily forecast data from One Call API
        from datetime import datetime
        
        forecast_list = []
        # Get next 8 days (skip today, start from tomorrow)
        daily_data = data.get('daily', [])[1:9]  # Skip index 0 (today), get next 8 days
        
        for day_data in daily_data:
            # Extract date from timestamp
            date_timestamp = day_data['dt']
            date_obj = datetime.fromtimestamp(date_timestamp)
            date_str = date_obj.strftime('%Y-%m-%d')
            day_name = date_obj.strftime('%A')  # Full day name (Monday, Tuesday, etc.)
            short_date = date_obj.strftime('%b %d')  # Short date (Jan 15)
            
            # One Call API provides temp.max and temp.min directly
            high_temp = round(day_data['temp']['max'])
            low_temp = round(day_data['temp']['min'])
            icon = day_data['weather'][0]['icon']
            description = day_data['weather'][0]['description']
            
            forecast_list.append({
                'date': date_str,
                'day_name': day_name,
                'short_date': short_date,
                'high_temp': high_temp,
                'low_temp': low_temp,
                'icon': icon,
                'description': description.title()
            })
        
        # Get city name from city_info if available, otherwise use coordinates
        city_name = city_info['name'] if city_info else f'Lat: {lat}, Lon: {lon}'
        country = city_info['country'] if city_info else ''
        
        return jsonify({
            'city': city_name,
            'country': country,
            'forecast': forecast_list
        })
    
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        # Check if it's a subscription error
        if '401' in error_msg or 'subscription' in error_msg.lower():
            return jsonify({
                'error': 'One Call API subscription required. Please subscribe to "One Call API 3.0" in your OpenWeatherMap account (free tier available).'
            }), 401
        return jsonify({'error': f'Failed to fetch forecast data: {error_msg}'}), 500
    except KeyError as e:
        return jsonify({'error': f'Unexpected response format from weather API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/get-hourly', methods=['GET'])
def get_hourly():
    """
    Endpoint to get 48-hour hourly weather forecast for a city or coordinates using One Call API 3.0.
    Usage: 
    - By city: http://127.0.0.1:5000/get-hourly?city=London
    - By coordinates: http://127.0.0.1:5000/get-hourly?lat=51.5074&lon=-0.1278
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    city_info = None
    
    # Validate input - need either city OR both lat and lon
    if not city and (not lat or not lon):
        return jsonify({
            'error': 'Either city parameter or both lat and lon parameters are required',
            'examples': {
                'by_city': '/get-hourly?city=London',
                'by_coordinates': '/get-hourly?lat=51.5074&lon=-0.1278'
            }
        }), 400
    
    try:
        # Step A: If city name provided, get coordinates using Geocoding API
        if city and (not lat or not lon):
            lat, lon, city_info = get_coordinates_from_city(city)
            if not lat or not lon:
                return jsonify({
                    'error': f'Could not find coordinates for city: {city}'
                }), 404
        
        # Step B: Use One Call API with lat and lon
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',  # Get temperature in Celsius
            'exclude': 'current,minutely,daily,alerts'  # We only need hourly forecast
        }
        
        response = requests.get(ONE_CALL_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Process hourly forecast data from One Call API
        from datetime import datetime
        
        hourly_list = []
        # Get next 48 hours (first 48 entries in hourly array)
        hourly_data = data.get('hourly', [])[:48]
        
        for hour_data in hourly_data:
            # Extract time from timestamp
            time_timestamp = hour_data['dt']
            dt = datetime.fromtimestamp(time_timestamp)
            
            hourly_list.append({
                'time': dt.strftime('%H:%M'),
                'hour': dt.hour,
                'date': dt.strftime('%Y-%m-%d'),
                'temperature': round(hour_data['temp']),
                'feels_like': round(hour_data['feels_like']),
                'description': hour_data['weather'][0]['description'].title(),
                'icon': hour_data['weather'][0]['icon'],
                'humidity': hour_data.get('humidity', 0),
                'wind_speed': hour_data.get('wind_speed', 0),
                'precipitation': hour_data.get('rain', {}).get('1h', 0) if hour_data.get('rain') else 0
            })
        
        # Get city name from city_info if available, otherwise use coordinates
        city_name = city_info['name'] if city_info else f'Lat: {lat}, Lon: {lon}'
        country = city_info['country'] if city_info else ''
        
        return jsonify({
            'city': city_name,
            'country': country,
            'hourly': hourly_list
        })
    
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        # Check if it's a subscription error
        if '401' in error_msg or 'subscription' in error_msg.lower():
            return jsonify({
                'error': 'One Call API subscription required. Please subscribe to "One Call API 3.0" in your OpenWeatherMap account (free tier available).'
            }), 401
        return jsonify({'error': f'Failed to fetch hourly forecast data: {error_msg}'}), 500
    except KeyError as e:
        return jsonify({'error': f'Unexpected response format from weather API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/get-minute-forecast', methods=['GET'])
def get_minute_forecast():
    """
    Endpoint to get minute-by-minute precipitation forecast for the next 60 minutes using One Call API 3.0.
    Usage: 
    - By city: http://127.0.0.1:5000/get-minute-forecast?city=London
    - By coordinates: http://127.0.0.1:5000/get-minute-forecast?lat=51.5074&lon=-0.1278
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    city_info = None
    
    # Validate input - need either city OR both lat and lon
    if not city and (not lat or not lon):
        return jsonify({
            'error': 'Either city parameter or both lat and lon parameters are required',
            'examples': {
                'by_city': '/get-minute-forecast?city=London',
                'by_coordinates': '/get-minute-forecast?lat=51.5074&lon=-0.1278'
            }
        }), 400
    
    try:
        # Step A: If city name provided, get coordinates using Geocoding API
        if city and (not lat or not lon):
            lat, lon, city_info = get_coordinates_from_city(city)
            if not lat or not lon:
                return jsonify({
                    'error': f'Could not find coordinates for city: {city}'
                }), 404
        
        # Step B: Use One Call API with lat and lon
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',
            'exclude': 'current,hourly,daily,alerts'  # We only need minutely forecast
        }
        
        response = requests.get(ONE_CALL_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Process minutely forecast data from One Call API
        from datetime import datetime
        
        minute_list = []
        minutely_data = data.get('minutely', [])
        
        for minute_data in minutely_data:
            # Extract time from timestamp
            time_timestamp = minute_data['dt']
            dt = datetime.fromtimestamp(time_timestamp)
            
            minute_list.append({
                'time': dt.strftime('%H:%M'),
                'datetime': dt.isoformat(),
                'precipitation': minute_data.get('precipitation', 0)  # Precipitation in mm
            })
        
        # Get city name from city_info if available, otherwise use coordinates
        city_name = city_info['name'] if city_info else f'Lat: {lat}, Lon: {lon}'
        country = city_info['country'] if city_info else ''
        
        return jsonify({
            'city': city_name,
            'country': country,
            'minutely': minute_list
        })
    
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        # Check if it's a subscription error
        if '401' in error_msg or 'subscription' in error_msg.lower():
            return jsonify({
                'error': 'One Call API subscription required. Please subscribe to "One Call API 3.0" in your OpenWeatherMap account (free tier available).'
            }), 401
        return jsonify({'error': f'Failed to fetch minute forecast data: {error_msg}'}), 500
    except KeyError as e:
        return jsonify({'error': f'Unexpected response format from weather API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/get-alerts', methods=['GET'])
def get_alerts():
    """
    Endpoint to get government weather alerts for a city or coordinates using One Call API 3.0.
    Usage: 
    - By city: http://127.0.0.1:5000/get-alerts?city=London
    - By coordinates: http://127.0.0.1:5000/get-alerts?lat=51.5074&lon=-0.1278
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    city_info = None
    
    # Validate input - need either city OR both lat and lon
    if not city and (not lat or not lon):
        return jsonify({
            'error': 'Either city parameter or both lat and lon parameters are required',
            'examples': {
                'by_city': '/get-alerts?city=London',
                'by_coordinates': '/get-alerts?lat=51.5074&lon=-0.1278'
            }
        }), 400
    
    try:
        # Step A: If city name provided, get coordinates using Geocoding API
        if city and (not lat or not lon):
            lat, lon, city_info = get_coordinates_from_city(city)
            if not lat or not lon:
                return jsonify({
                    'error': f'Could not find coordinates for city: {city}'
                }), 404
        
        # Step B: Use One Call API with lat and lon
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric',
            'exclude': 'current,minutely,hourly,daily'  # We only need alerts
        }
        
        response = requests.get(ONE_CALL_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Process alerts data from One Call API
        from datetime import datetime
        
        alerts_list = []
        alerts_data = data.get('alerts', [])
        
        for alert_data in alerts_data:
            # Extract timestamps
            start_ts = alert_data.get('start')
            end_ts = alert_data.get('end')
            
            start_dt = datetime.fromtimestamp(start_ts) if start_ts else None
            end_dt = datetime.fromtimestamp(end_ts) if end_ts else None
            
            alerts_list.append({
                'sender_name': alert_data.get('sender_name', ''),
                'event': alert_data.get('event', ''),
                'start': start_dt.isoformat() if start_dt else None,
                'end': end_dt.isoformat() if end_dt else None,
                'description': alert_data.get('description', ''),
                'tags': alert_data.get('tags', [])
            })
        
        # Get city name from city_info if available, otherwise use coordinates
        city_name = city_info['name'] if city_info else f'Lat: {lat}, Lon: {lon}'
        country = city_info['country'] if city_info else ''
        
        return jsonify({
            'city': city_name,
            'country': country,
            'alerts': alerts_list
        })
    
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        # Check if it's a subscription error
        if '401' in error_msg or 'subscription' in error_msg.lower():
            return jsonify({
                'error': 'One Call API subscription required. Please subscribe to "One Call API 3.0" in your OpenWeatherMap account (free tier available).'
            }), 401
        return jsonify({'error': f'Failed to fetch alerts data: {error_msg}'}), 500
    except KeyError as e:
        return jsonify({'error': f'Unexpected response format from weather API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/search-cities', methods=['GET'])
def search_cities():
    """
    Endpoint to search for city suggestions based on query.
    Usage: http://127.0.0.1:5000/search-cities?q=lon&limit=5
    """
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', '5')
    
    if not query:
        return jsonify({'suggestions': []})
    
    try:
        # Use OpenWeatherMap Geocoding API for city search
        params = {
            'q': query,
            'limit': limit,
            'appid': OPENWEATHER_API_KEY
        }
        
        response = requests.get(GEOCODING_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Format the response
        suggestions = []
        for item in data:
            city_name = item.get('name', '')
            state = item.get('state', '')
            country = item.get('country', '')
            
            # Create a display name
            display_name = city_name
            if state:
                display_name += f', {state}'
            display_name += f', {country}'
            
            suggestions.append({
                'name': city_name,
                'state': state,
                'country': country,
                'display_name': display_name,
                'lat': item.get('lat'),
                'lon': item.get('lon')
            })
        
        return jsonify({'suggestions': suggestions})
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to fetch city suggestions: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Weather API is running'})

if __name__ == '__main__':
    print('Starting Weather API server...')
    print('Make sure to set OPENWEATHER_API_KEY environment variable')
    app.run(debug=True, port=5000)

