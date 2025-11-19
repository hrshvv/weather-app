# Weather App

A full-stack weather application with a Python Flask backend and Next.js frontend. This application provides real-time weather data, forecasts, and city search functionality using the **Open-Meteo.com** API - a free, open-source weather API that doesn't require API keys.

## Features

- **Current Weather**: Get real-time weather information for any city worldwide
- **7-Day Forecast**: Daily weather forecast with high/low temperatures, precipitation, wind, and UV index
- **48-Hour Hourly Forecast**: Detailed hourly forecast with temperature, humidity, precipitation, pressure, cloud cover, UV index, and wind data
- **City Search**: Search and get suggestions for city names with autocomplete
- **Comprehensive Data**: Display all available weather metrics including humidity, pressure, cloud cover, wind direction, and UV index
- **Modern UI**: Beautiful, responsive interface with dark/light theme support
- **Real-time Data**: Live weather data from Open-Meteo.com API (free, no API key required)

## Project Structure

```
weather-app/
├── backend/              # Python Flask API
│   ├── app.py           # Main Flask application
│   └── requirements.txt # Python dependencies
└── frontend/            # Next.js React application
    ├── app/             # Next.js app directory
    │   ├── page.tsx     # Main page component
    │   ├── layout.tsx   # Root layout
    │   └── globals.css  # Global styles
    ├── components/      # React components
    │   ├── weather-card.tsx
    │   ├── theme-toggle.tsx
    │   └── ui/          # UI components (buttons, cards, etc.)
    ├── lib/             # Utility functions
    └── package.json     # Node.js dependencies
```

## Prerequisites

- **Python 3.7 or higher** - For the backend server
- **Node.js 18 or higher** - For the frontend application
- **npm or yarn** - Package manager for Node.js
- **No API Key Required!** - This app uses [Open-Meteo.com](https://open-meteo.com), a free, open-source weather API that doesn't require registration or API keys.

## Setup Instructions

### Step 1: Backend Setup (Python)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the backend server:**
   - **No API key or configuration needed!** The app uses Open-Meteo.com which is completely free and doesn't require registration.
   ```bash
   python app.py
   ```

   The backend will run on `http://127.0.0.1:3000`

   You should see:
   ```
   Weather API running on http://localhost:3000
   * Running on http://127.0.0.1:3000
   ```

### Step 2: Frontend Setup (Next.js)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

### Step 3: Open in Browser

1. Open your browser and go to: **http://localhost:3000**
2. Enter a city name (e.g., "London", "New York", "Tokyo")
3. Click "Search" to see the weather!

**Important:** Make sure both servers are running at the same time:
- Backend on `http://127.0.0.1:3000`
- Frontend on `http://localhost:3000`

**Note:** This app uses [Open-Meteo.com](https://open-meteo.com) - a free, open-source weather API. No API keys, registration, or subscriptions required!

## API Endpoints

The backend provides the following REST API endpoints:

### Core Endpoints

| Endpoint | Method | Description | Parameters | Example |
|----------|--------|-------------|------------|---------|
| `/weather` | GET | Get comprehensive weather data (current, hourly, daily) | `city` | `http://127.0.0.1:3000/weather?city=London` |
| `/search-cities` | GET | Search for city suggestions | `q` (query), `limit` (optional) | `http://127.0.0.1:3000/search-cities?q=lon&limit=5` |

### Endpoint Details

#### Get Weather
- **By City:** `GET /weather?city=London`
- **Response:** JSON with comprehensive weather data including:
  - Current weather (temperature, wind, weather code)
  - Hourly forecast (48 hours: temperature, humidity, precipitation, pressure, cloud cover, UV index, wind)
  - Daily forecast (7 days: high/low temps, precipitation, wind, UV index, sunrise/sunset)

#### Search Cities
- **Query:** `GET /search-cities?q=lon&limit=5`
- **Response:** JSON array of city suggestions with display names and coordinates

#### Health Check
- **Endpoint:** `GET /health`
- **Response:** `{"status": "ok", "message": "Weather API is running"}`

## How It Works

### Backend (Python Flask)

1. The Flask server receives HTTP requests from the frontend
2. It validates the request parameters (city name)
3. Uses Open-Meteo.com geocoding API to convert city names to coordinates
4. Makes API calls to Open-Meteo.com forecast API (no API key required!)
5. Processes and formats the weather data with all available metrics
6. Returns comprehensive JSON responses to the frontend
7. Handles errors gracefully with appropriate error messages

### Frontend (Next.js)

1. User enters a city name in the search box
2. Frontend sends a request to the Python backend at `http://127.0.0.1:3000/weather?city=...`
3. Backend fetches comprehensive weather data from Open-Meteo.com (free, no API key needed!)
4. Frontend receives and displays all weather information including:
   - Current conditions (temperature, humidity, wind, pressure, cloud cover, UV index)
   - 48-hour hourly forecast with detailed metrics
   - 7-day daily forecast with precipitation, wind, and UV data
5. Supports dark/light theme toggle
6. Responsive design works on all screen sizes

## Testing the API

### Quick Health Check

**Using curl (Windows PowerShell):**
```powershell
curl http://127.0.0.1:3000/weather?city=London
```

**Using curl (Mac/Linux):**
```bash
curl "http://127.0.0.1:3000/weather?city=London"
```

**Using a web browser:**
Just open: `http://127.0.0.1:3000/weather?city=London`

**Expected response:**
```json
{
  "status": "ok",
  "message": "Weather API is running"
}
```

### Test Weather Endpoint

**Get comprehensive weather data for a city:**
```bash
curl "http://127.0.0.1:3000/weather?city=London"
```

**Using Python requests:**
```python
import requests

# Get weather (includes current, hourly, and daily forecast)
response = requests.get("http://127.0.0.1:3000/weather", params={"city": "London"})
print(response.json())
```

### Test City Search

```bash
curl "http://127.0.0.1:3000/search-cities?q=lon&limit=5"
```

## Troubleshooting

### CORS Errors

The backend already includes CORS support via `flask-cors`. If you still see CORS errors, make sure:
- The backend is running
- You're using the correct URL (`http://127.0.0.1:5000`)

### API Key Issues

- **No API key needed!** This app uses Open-Meteo.com which is completely free and doesn't require registration or API keys.
- If you see errors, check your internet connection and ensure the Open-Meteo API is accessible.

### Connection Issues

- Ensure the backend is running before starting the frontend
- Check that both servers are running on the correct ports (3000 for backend, 3000 for frontend - use different ports if needed)
- Verify there are no firewall issues blocking the connections

### "Cannot connect to API" Error

**Solution:** Make sure the Flask server is running. Start it with `python app.py` in the backend directory.

### "401 Unauthorized" or "subscription required" Error

**Solution:** 
- This shouldn't happen with Open-Meteo.com as it's completely free
- If you see this error, check that you're using the correct endpoint (`/weather`)
- Ensure the backend is using Open-Meteo API, not OpenWeatherMap

### "Failed to fetch weather data" Error

**Solution:**
- Check your internet connection
- Verify the city name is spelled correctly
- Try a different city name
- Check that Open-Meteo.com API is accessible (visit https://open-meteo.com in your browser)

### Environment Variable Issues

**No environment variables needed!** This app uses Open-Meteo.com which doesn't require any configuration.

## Technologies Used

### Backend
- **Python 3.7+** - Programming language
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing support
- **Requests 2.31.0** - HTTP library for API calls
- **Open-Meteo.com API** - Free weather data API (no API key required!)

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **next-themes** - Theme management (dark/light mode)
- **Lucide React** - Icon library

## Development

### Running in Development Mode

1. **Backend:** `python app.py` (runs on port 3000 by default, configurable via PORT env var)
2. **Frontend:** `npm run dev` (runs on port 3000)

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
The Flask app can be run directly with `python app.py` or deployed using a WSGI server like Gunicorn.

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Ensure both servers are running
3. Check the [Open-Meteo.com API documentation](https://open-meteo.com/en/docs) for API-specific information
4. Visit [Open-Meteo.com](https://open-meteo.com) to learn more about the free weather API

---

**Happy Weather Tracking! 🌤️**
