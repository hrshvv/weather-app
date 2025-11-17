# Weather App

A full-stack weather application with a Python Flask backend and Next.js frontend. This application provides real-time weather data, forecasts, and city search functionality using the OpenWeatherMap API.

## Features

- **Current Weather**: Get real-time weather information for any city worldwide
- **Weather Forecast**: 5-day weather forecast (requires One Call API 3.0 subscription)
- **Hourly Forecast**: 24-hour hourly weather forecast (requires One Call API 3.0 subscription)
- **City Search**: Search and get suggestions for city names
- **Location-based**: Search by city name or coordinates (latitude/longitude)
- **Modern UI**: Beautiful, responsive interface with dark/light theme support
- **Real-time Data**: Live weather data from OpenWeatherMap API

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
- **OpenWeatherMap API Key** - Free account available at [openweathermap.org](https://openweathermap.org/api)
- **One Call API 3.0 Subscription** (Optional) - Required for forecast and hourly endpoints (free tier available)

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

3. **Get your OpenWeatherMap API key:**
   - Sign up for a free account at [https://openweathermap.org/api](https://openweathermap.org/api)
   - After signing up, go to [https://home.openweathermap.org/api_keys](https://home.openweathermap.org/api_keys)
   - Copy your API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

4. **Subscribe to One Call API 3.0 (Optional - for forecast/hourly features):**
   - Log in to your OpenWeatherMap account
   - Go to the "Pricing" page
   - Find "One Call API 3.0"
   - Click "Subscribe" and choose the "One Call by Call" free plan
   - This gives you 1,000 free calls per day
   - Note: It may ask for a payment method to prevent abuse, but you will not be charged as long as you stay within the 1,000 calls/day limit

5. **Create a `.env` file in the `backend` directory:**
   - Create a new file named `.env` (no extension)
   - Add this line (replace with your actual API key):
     ```
     OPENWEATHER_API_KEY=your-actual-api-key-here
     ```
   - Save the file

6. **Run the backend server:**
   ```bash
   python app.py
   ```

   The backend will run on `http://127.0.0.1:5000`

   You should see:
   ```
   [OK] Loaded .env from: backend\.env
   [OK] API Key loaded successfully: xxxx...
   Starting Weather API server...
   * Running on http://127.0.0.1:5000
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
- Backend on `http://127.0.0.1:5000`
- Frontend on `http://localhost:3000`

## API Endpoints

The backend provides the following REST API endpoints:

### Core Endpoints

| Endpoint | Method | Description | Parameters | Example |
|----------|--------|-------------|------------|---------|
| `/` | GET | API information and available endpoints | None | `http://127.0.0.1:5000/` |
| `/health` | GET | Health check endpoint | None | `http://127.0.0.1:5000/health` |
| `/get-weather` | GET | Get current weather data | `city` or `lat` & `lon` | `http://127.0.0.1:5000/get-weather?city=London` |
| `/search-cities` | GET | Search for city suggestions | `q` (query), `limit` (optional) | `http://127.0.0.1:5000/search-cities?q=lon&limit=5` |
| `/api-offerings` | GET | Get list of API capabilities | None | `http://127.0.0.1:5000/api-offerings` |

### Advanced Endpoints (Require One Call API 3.0 Subscription)

| Endpoint | Method | Description | Parameters | Example |
|----------|--------|-------------|------------|---------|
| `/get-forecast` | GET | Get 5-day weather forecast | `city` or `lat` & `lon` | `http://127.0.0.1:5000/get-forecast?city=London` |
| `/get-hourly` | GET | Get 24-hour hourly forecast | `city` or `lat` & `lon` | `http://127.0.0.1:5000/get-hourly?city=London` |
| `/get-minute-forecast` | GET | Get 60-minute precipitation forecast | `city` or `lat` & `lon` | `http://127.0.0.1:5000/get-minute-forecast?city=London` |
| `/get-alerts` | GET | Get weather alerts for a location | `city` or `lat` & `lon` | `http://127.0.0.1:5000/get-alerts?city=London` |

### Endpoint Details

#### Get Weather
- **By City:** `GET /get-weather?city=London`
- **By Coordinates:** `GET /get-weather?lat=51.5074&lon=-0.1278`
- **Response:** JSON with city, country, temperature, description, humidity, wind speed, icon, and more

#### Search Cities
- **Query:** `GET /search-cities?q=lon&limit=5`
- **Response:** JSON array of city suggestions with display names and coordinates

#### Health Check
- **Endpoint:** `GET /health`
- **Response:** `{"status": "ok", "message": "Weather API is running"}`

## How It Works

### Backend (Python Flask)

1. The Flask server receives HTTP requests from the frontend
2. It validates the request parameters (city name or coordinates)
3. Makes API calls to OpenWeatherMap using your API key
4. Processes and formats the weather data
5. Returns JSON responses to the frontend
6. Handles errors gracefully with appropriate error messages

### Frontend (Next.js)

1. User enters a city name in the search box
2. Frontend sends a request to the Python backend at `http://127.0.0.1:5000/get-weather?city=...`
3. Backend fetches weather data from OpenWeatherMap
4. Frontend receives and displays the weather information in a beautiful card layout
5. Supports dark/light theme toggle
6. Responsive design works on all screen sizes

## Testing the API

### Quick Health Check

**Using curl (Windows PowerShell):**
```powershell
curl http://127.0.0.1:5000/health
```

**Using curl (Mac/Linux):**
```bash
curl http://127.0.0.1:5000/health
```

**Using a web browser:**
Just open: `http://127.0.0.1:5000/health`

**Expected response:**
```json
{
  "status": "ok",
  "message": "Weather API is running"
}
```

### Test Weather Endpoint

**Get weather for a city:**
```bash
curl "http://127.0.0.1:5000/get-weather?city=London"
```

**Get weather by coordinates:**
```bash
curl "http://127.0.0.1:5000/get-weather?lat=51.5074&lon=-0.1278"
```

**Using Python requests:**
```python
import requests

# Health check
response = requests.get("http://127.0.0.1:5000/health")
print(response.json())

# Get weather
response = requests.get("http://127.0.0.1:5000/get-weather", params={"city": "London"})
print(response.json())
```

### Test City Search

```bash
curl "http://127.0.0.1:5000/search-cities?q=lon&limit=5"
```

## Troubleshooting

### CORS Errors

The backend already includes CORS support via `flask-cors`. If you still see CORS errors, make sure:
- The backend is running
- You're using the correct URL (`http://127.0.0.1:5000`)

### API Key Issues

- Make sure you created the `.env` file in the `backend` directory
- Check that the `.env` file contains: `OPENWEATHER_API_KEY=your-actual-key`
- Verify your API key is correct on OpenWeatherMap's website
- Free tier allows 60 calls per minute
- Wait a few minutes after creating a new API key (it may take time to activate)

### Connection Issues

- Ensure the backend is running before starting the frontend
- Check that both servers are running on the correct ports (5000 for backend, 3000 for frontend)
- Verify there are no firewall issues blocking the connections

### "Cannot connect to API" Error

**Solution:** Make sure the Flask server is running. Start it with `python app.py` in the backend directory.

### "401 Unauthorized" or "subscription required" Error

**Solution:** 
- For forecast/hourly endpoints, you need to subscribe to One Call API 3.0
- Go to [https://openweathermap.org/api](https://openweathermap.org/api)
- Subscribe to "One Call API 3.0" (free tier available)

### "Failed to fetch weather data" Error

**Solution:**
- Check your internet connection
- Verify your API key is correct
- Make sure you haven't exceeded API rate limits
- Try a different city name

### Environment Variable Issues

**On Windows (PowerShell):**
```powershell
$env:OPENWEATHER_API_KEY="your-api-key-here"
```

**On Windows (Command Prompt):**
```cmd
set OPENWEATHER_API_KEY=your-api-key-here
```

**On Mac/Linux:**
```bash
export OPENWEATHER_API_KEY="your-api-key-here"
```

**Note:** Using a `.env` file is recommended over environment variables for easier management.

## Technologies Used

### Backend
- **Python 3.7+** - Programming language
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing support
- **Requests 2.31.0** - HTTP library for API calls
- **python-dotenv 1.0.0** - Environment variable management

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

1. **Backend:** `python app.py` (runs on port 5000)
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
2. Verify your API key is correctly configured
3. Ensure both servers are running
4. Check the OpenWeatherMap API documentation for API-specific issues

---

**Happy Weather Tracking! 🌤️**
