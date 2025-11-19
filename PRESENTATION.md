# Weather App Project Presentation
## Full-Stack Weather Application with Flask & Next.js

---

## Page 1: Title & Introduction

# Weather App
## Full-Stack Weather Application

**Modern weather app with Python Flask backend and Next.js frontend**

- **Type:** Full-Stack Web Application
- **Purpose:** Real-time weather data for any city worldwide
- **Key Feature:** Uses Open-Meteo.com API - free, no API key required!

**Highlights:**
- Full-stack development (Python, React, TypeScript)
- Modern UI with dark/light themes
- Production-ready architecture

---

## Page 2: Features

# Core Features

## Main Features
- **Current Weather** - Temperature, humidity, wind, pressure, UV index
- **7-Day Forecast** - Daily predictions with high/low temps, precipitation
- **48-Hour Hourly Forecast** - Detailed hourly breakdown
- **City Search** - Autocomplete with global city database

## UX Features
- Dark/Light theme toggle
- Responsive design (mobile, tablet, desktop)
- Loading states & error handling
- Smooth animations

---

## Page 3: Technology Stack

# Technology Stack

## Backend
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin support
- **Requests 2.31.0** - HTTP library
- **Python 3.7+**

## Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Components
- **Lucide React** - Icons

---

## Page 4: Architecture

# Architecture & Data Flow

## System Architecture
```
Browser → Next.js Frontend → Flask Backend → Open-Meteo API
```

## Data Flow
1. User enters city name
2. Frontend sends request to Flask backend
3. Backend geocodes city → gets coordinates
4. Backend fetches weather from Open-Meteo
5. Backend processes & formats data
6. Frontend displays weather information

## Project Structure
```
weather-app/
├── backend/          # Flask API
│   └── app.py
└── frontend/         # Next.js app
    ├── app/
    ├── components/
    └── lib/
```

---

## Page 5: Backend

# Backend Implementation

## API Endpoints

**`GET /weather?city=London`**
- Returns: Current weather, 48h hourly, 7-day daily forecast

**`GET /search-cities?q=lon&limit=5`**
- Returns: City suggestions for autocomplete

**`GET /health`**
- Returns: Server status

## Key Functions
- `geocode_city()` - Converts city name to coordinates
- `fetch_weather()` - Gets weather data from Open-Meteo

## Features
- Input validation
- Error handling
- CORS enabled
- URL encoding

---

## Page 6: Frontend

# Frontend Implementation

## Main Components
- **`page.tsx`** - Main app (search, display, forecasts)
- **`weather-card.tsx`** - Weather display component
- **`theme-toggle.tsx`** - Dark/light mode switcher

## Key Features
- React hooks for state management
- Fetch API for HTTP requests
- Autocomplete search
- Responsive layouts
- TypeScript types for safety
- Loading & error states

---

## Page 7: API Integration

# API Integration

## Open-Meteo.com API

**Why Open-Meteo?**
- ✅ Free, no API key required
- ✅ No registration needed
- ✅ Comprehensive weather data
- ✅ Global coverage

## APIs Used
1. **Geocoding API:** City name $\rightarrow$ coordinates.
2. **Forecast API:** Returns current, hourly, and daily weather data.

## Request Flow
```
User → Backend → Geocoding API → Forecast API → Process → Display
```

---

## Page 8: Setup

# Setup & Installation

## Prerequisites
- Python 3.7+
- Node.js 18+
- No API key needed!

## Quick Start

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:** `http://localhost:3000`

---

## Page 9: Demo & Usage

# Demo & Usage

## How to Use
1. Open `http://localhost:3000`
2. Enter city name (e.g., "London", "New York")
3. View current weather, hourly & daily forecasts

## What You'll See
- Current temperature & conditions
- Weather metrics (humidity, wind, pressure, UV)
- 48-hour hourly forecast
- 7-day daily forecast with precipitation
- Dark/light theme toggle

---

## Page 10: Conclusion

# Conclusion

## What We Built
✅ Full-stack weather application  
✅ Modern, responsive UI  
✅ Production-ready codebase  
✅ Free API (no keys needed)  

## Technologies
- Python Flask (Backend)
- Next.js & React (Frontend)
- TypeScript (Type safety)
- Tailwind CSS (Styling)

## Future Enhancements
- Weather maps
- Multiple saved locations
- Weather alerts
- Charts & graphs
- Mobile app
- Offline support

## Thank You!

*Built with ❤️ using Flask, Next.js, and Open-Meteo.com*
