'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  Cloud,
  Droplets,
  Wind,
  Loader2,
  MapPin,
  Gauge,
  Sun,
  Moon,
  Clock,
  Navigation,
  X,
  Compass,
  Cloudy,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import WeatherCard from '@/components/weather-card'
import type { GetWeatherResult } from '@/components/ui/component'
import { getWeatherCodeInfo, formatDate, formatTimeFromISO8601 } from '@/lib/weather-utils'

interface WeatherData {
  city: string
  country: string
  temperature: number
  feels_like: number
  description: string
  humidity: number
  wind_speed: number
  wind_direction?: number
  icon: string
  pressure?: number
  cloud_cover?: number
  sunrise?: string
  sunset?: string
  timezone?: number
  uv_index?: number
  visibility?: number
}

interface ForecastDay {
  date: string
  day_name: string
  short_date: string
  high_temp: number
  low_temp: number
  icon: string
  description: string
  precipitation_sum?: number
  wind_speed_max?: number
  wind_gusts_max?: number
  wind_direction?: number
  precipitation_probability?: number
}

interface ForecastData {
  city: string
  country: string
  forecast: ForecastDay[]
}

interface CitySuggestion {
  name: string
  state: string
  country: string
  display_name: string
  lat: number
  lon: number
}

interface HourlyData {
  time: string
  hour: number
  date: string
  temperature: number
  feels_like: number
  description: string
  icon: string
  humidity: number
  wind_speed: number
  wind_direction?: number
  precipitation: number
  pressure?: number
  cloud_cover?: number
  is_day?: number
}

interface HourlyForecast {
  city: string
  country: string
  hourly: HourlyData[]
}

type TemperatureUnit = 'C' | 'F'

export default function Home() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [unit, setUnit] = useState<TemperatureUnit>('C')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentWeatherCards, setRecentWeatherCards] = useState<GetWeatherResult[]>([])
  const [loadingRecentCards, setLoadingRecentCards] = useState<{ [key: string]: boolean }>({})
  const [showHourly, setShowHourly] = useState(false)
  const [showForecast, setShowForecast] = useState(true)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchCitySuggestions = useCallback(async (query: string) => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch(
        `http://127.0.0.1:3000/search-cities?q=${encodeURIComponent(query)}&limit=5`
      )

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(data.suggestions && data.suggestions.length > 0)
      }
    } catch (err) {
      // Silently fail for suggestions
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Debounce function for city suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (city.trim().length >= 2) {
        fetchCitySuggestions(city.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [city, fetchCitySuggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('weather-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (cityName: string) => {
    const updated = [cityName, ...recentSearches.filter(s => s !== cityName)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('weather-recent-searches', JSON.stringify(updated))
  }

  // Convert temperature based on unit
  const convertTemp = (temp: number): number => {
    if (unit === 'F') {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  // Fetch weather for a city (for recent search cards)
  const fetchWeatherForCard = useCallback(async (cityName: string) => {
    setLoadingRecentCards(prev => {
      if (prev[cityName]) return prev
      return { ...prev, [cityName]: true }
    })
    
    try {
      const response = await fetch(`http://127.0.0.1:3000/weather?city=${encodeURIComponent(cityName)}`)
      if (response.ok) {
        const apiData = await response.json()
        
        // Transform Open-Meteo data to WeatherData format
        const current = apiData.current
        const location = apiData.location
        const daily = apiData.daily
        const weatherCodeInfo = getWeatherCodeInfo(current?.weathercode || 0)
        
        // Get today's high/low from daily forecast
        const todayHigh = daily?.temperature_2m_max?.[0] || current?.temperature || 0
        const todayLow = daily?.temperature_2m_min?.[0] || current?.temperature || 0
        
        // Convert to GetWeatherResult format
        const cardData: GetWeatherResult = {
          location: `${location.resolved_name}, ${location.country}`,
          unit: unit,
          temperature: convertTemp(current?.temperature || 0),
          condition: weatherCodeInfo.description,
          high: convertTemp(todayHigh),
          low: convertTemp(todayLow),
          humidity: 0.5, // Open-Meteo doesn't provide humidity in current_weather
          windKph: Math.round(current?.windspeed || 0), // Already in km/h from Open-Meteo
          icon: weatherCodeInfo.icon
        }
        
        setRecentWeatherCards(prev => {
          const filtered = prev.filter(w => w.location !== cardData.location)
          return [cardData, ...filtered].slice(0, 5)
        })
      }
    } catch (err) {
      // Silently fail for recent cards
    } finally {
      setLoadingRecentCards(prev => ({ ...prev, [cityName]: false }))
    }
  }, [unit])

  // Load weather for recent searches
  useEffect(() => {
    if (recentSearches.length > 0) {
      recentSearches.forEach(cityName => {
        fetchWeatherForCard(cityName)
      })
    }
  }, [recentSearches, fetchWeatherForCard])

  // Format time from ISO8601 string or timestamp
  const formatTime = (time: string | number | undefined, timezone?: number): string => {
    if (!time) return ''
    if (typeof time === 'string') {
      return formatTimeFromISO8601(time)
    }
    // Legacy timestamp support
    const date = new Date((time + (timezone || 0)) * 1000)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Group hourly data by day
  const groupHourlyByDay = (hourly: HourlyData[]) => {
    const groups: { [key: string]: { label: string; hours: HourlyData[] } } = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    hourly.forEach((hour) => {
      // Parse date from YYYY-MM-DD and time from HH:MM format
      const [hours, minutes] = hour.time.split(':').map(Number)
      const hourDate = new Date(hour.date)
      hourDate.setHours(hours, minutes, 0, 0)
      const dayKey = hourDate.toDateString()
      
      const hourDateOnly = new Date(hourDate)
      hourDateOnly.setHours(0, 0, 0, 0)
      
      const isToday = hourDateOnly.getTime() === today.getTime()
      const isTomorrow = hourDateOnly.getTime() === tomorrow.getTime()
      
      let label = hourDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      if (isToday) label = 'Today'
      else if (isTomorrow) label = 'Tomorrow'
      
      if (!groups[dayKey]) {
        groups[dayKey] = { label, hours: [] }
      }
      groups[dayKey].hours.push(hour)
    })
    
    return Object.values(groups)
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Reverse geocode to get city name, then fetch weather
          const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
          )
          
          if (!geoResponse.ok) {
            throw new Error('Failed to get location name')
          }
          
          const geoData = await geoResponse.json()
          if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Location not found')
          }
          
          const locationName = geoData.results[0].name
          const cityQuery = `${locationName}, ${geoData.results[0].country}`
          
          // Fetch weather using city name
          await fetchWeather(cityQuery)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to get location weather')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setError('Unable to retrieve your location. Please enable location access.')
        setLoading(false)
      }
    )
  }

  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    // Use just the city name for better geocoding results
    const cityToSearch = suggestion.name
    setCity(suggestion.display_name)
    setShowSuggestions(false)
    // Trigger search immediately with the city name
    fetchWeather(cityToSearch)
  }

  const fetchWeather = async (cityName?: string) => {
    const searchCity = cityName || city.trim()
    if (!searchCity) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError(null)
    setWeather(null)
    setForecast(null)
    setHourlyForecast(null)
    setShowSuggestions(false)

    try {
      // Call new unified weather endpoint
      const weatherResponse = await fetch(
        `http://127.0.0.1:3000/weather?city=${encodeURIComponent(searchCity)}`
      )

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json()
        throw new Error(errorData.error || 'Failed to fetch weather data')
      }

      const apiData = await weatherResponse.json()
      const current = apiData.current
      const location = apiData.location
      const hourly = apiData.hourly
      const daily = apiData.daily
      
      // Transform current weather - get current hour data for additional metrics
      const weatherCodeInfo = getWeatherCodeInfo(current?.weathercode || 0)
      const currentTime = new Date()
      // Find the closest hour index to current time
      let currentHourIndex = 0
      if (hourly?.time && hourly.time.length > 0) {
        // Find the first hour that is >= current time, or use the closest one
        const foundIndex = hourly.time.findIndex((time: string) => {
          const hourTime = new Date(time)
          return hourTime >= currentTime
        })
        // If found, use it; otherwise find the closest hour
        if (foundIndex >= 0) {
          currentHourIndex = foundIndex
        } else {
          // Find the closest hour by comparing time differences
          let minDiff = Infinity
          hourly.time.forEach((time: string, index: number) => {
            const hourTime = new Date(time)
            const diff = Math.abs(hourTime.getTime() - currentTime.getTime())
            if (diff < minDiff) {
              minDiff = diff
              currentHourIndex = index
            }
          })
        }
      }
      
      // Calculate visibility estimate (Open-Meteo doesn't provide visibility directly)
      // Estimate based on cloud cover and weather conditions
      const cloudCover = hourly?.cloudcover?.[currentHourIndex] || 0
      const weatherCode = current?.weathercode || 0
      let visibilityEstimate = 10 // Default 10km
      if (weatherCode >= 45 && weatherCode <= 48) {
        visibilityEstimate = 0.5 // Fog
      } else if (weatherCode >= 61 && weatherCode <= 67) {
        visibilityEstimate = 2 // Rain
      } else if (weatherCode >= 71 && weatherCode <= 77) {
        visibilityEstimate = 1 // Snow
      } else if (cloudCover > 80) {
        visibilityEstimate = 5 // Heavy clouds
      } else if (cloudCover > 50) {
        visibilityEstimate = 8 // Moderate clouds
      }
      
      const weatherData: WeatherData = {
        city: location.resolved_name,
        country: location.country,
        temperature: current?.temperature || 0,
        feels_like: hourly?.apparent_temperature?.[currentHourIndex] || current?.temperature || 0,
        description: weatherCodeInfo.description,
        humidity: hourly?.relativehumidity_2m?.[currentHourIndex] || 0,
        wind_speed: current?.windspeed || 0, // Already in km/h
        wind_direction: current?.winddirection || hourly?.winddirection_10m?.[currentHourIndex],
        icon: weatherCodeInfo.icon,
        pressure: hourly?.pressure_msl?.[currentHourIndex] ? Math.round(hourly.pressure_msl[currentHourIndex]) : undefined,
        cloud_cover: hourly?.cloudcover?.[currentHourIndex],
        sunrise: daily?.sunrise?.[0] || undefined, // Store as ISO8601 string
        sunset: daily?.sunset?.[0] || undefined, // Store as ISO8601 string
        timezone: 0,
        uv_index: hourly?.uv_index?.[currentHourIndex] || daily?.uv_index_max?.[0] || 0,
        visibility: visibilityEstimate
      }

      // Transform daily forecast
      let forecastData: ForecastData | null = null
      if (daily && daily.time && daily.time.length > 0) {
          const forecastDays: ForecastDay[] = daily.time.slice(0, 10).map((dateStr: string, index: number) => {
          const { dayName, shortDate } = formatDate(dateStr)
          const weatherCode = daily.weathercode?.[index] || 0
          const codeInfo = getWeatherCodeInfo(weatherCode)
          
          return {
            date: dateStr,
            day_name: dayName,
            short_date: shortDate,
            high_temp: daily.temperature_2m_max?.[index] || 0,
            low_temp: daily.temperature_2m_min?.[index] || 0,
            icon: codeInfo.icon,
            description: codeInfo.description,
            precipitation_sum: daily.precipitation_sum?.[index],
            wind_speed_max: daily.windspeed_10m_max?.[index],
            wind_gusts_max: daily.windgusts_10m_max?.[index],
            wind_direction: daily.winddirection_10m_dominant?.[index],
            precipitation_probability: daily.precipitation_probability_max?.[index]
          }
        })
        
        forecastData = {
          city: location.resolved_name,
          country: location.country,
          forecast: forecastDays
        }
      }

      // Transform hourly forecast
      let hourlyData: HourlyForecast | null = null
      if (hourly && hourly.time && hourly.time.length > 0) {
        const hourlyList: HourlyData[] = hourly.time.slice(0, 48).map((timeStr: string, index: number) => {
          const date = new Date(timeStr) // timeStr is ISO8601 format
          const weatherCode = hourly.weathercode?.[index] || 0
          const codeInfo = getWeatherCodeInfo(weatherCode)
          
          return {
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            hour: date.getHours(),
            date: date.toISOString().split('T')[0], // YYYY-MM-DD format
            temperature: hourly.temperature_2m?.[index] || 0,
            feels_like: hourly.apparent_temperature?.[index] || 0,
            description: codeInfo.description,
            icon: codeInfo.icon,
            humidity: hourly.relativehumidity_2m?.[index] || 0,
            wind_speed: hourly.windspeed_10m?.[index] || 0,
            wind_direction: hourly.winddirection_10m?.[index],
            precipitation: hourly.precipitation?.[index] || 0,
            pressure: hourly.pressure_msl?.[index] ? Math.round(hourly.pressure_msl[index]) : undefined,
            cloud_cover: hourly.cloudcover?.[index],
            is_day: hourly.is_day?.[index]
          }
        })
        
        hourlyData = {
          city: location.resolved_name,
          country: location.country,
          hourly: hourlyList
        }
      }
      
      setWeather(weatherData)
      setForecast(forecastData)
      setHourlyForecast(hourlyData)
      if (hourlyData && hourlyData.hourly.length > 0) {
        setShowHourly(true)
      }
      saveRecentSearch(searchCity)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWeather()
  }

  // Get UV index description
  const getUVDescription = (uv: number): string => {
    if (uv <= 2) return 'Low UV'
    if (uv <= 5) return 'Moderate UV'
    if (uv <= 7) return 'High UV'
    if (uv <= 10) return 'Very High UV'
    return 'Extreme UV'
  }

  // Get humidity description
  const getHumidityDescription = (humidity: number): string => {
    if (humidity < 30) return 'Dry'
    if (humidity < 50) return 'Comfortable'
    if (humidity < 70) return 'Humidity is good'
    return 'Humid'
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background via-background to-accent-cool/5 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
        {/* Top Bar with Search and Theme Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent-cool animate-pulse-slow flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold gradient-text">Weather App</h1>
              </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-accent-cool z-10" />
                  <Input
                    ref={inputRef}
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                  placeholder="Search your location"
                  className="pl-7 sm:pl-9 pr-2 sm:pr-3 h-8 sm:h-9 md:h-10 w-full sm:w-48 md:w-64 text-xs sm:text-sm border-2 border-accent-cool/30 focus:border-accent-cool focus:ring-2 focus:ring-accent-cool/20 transition-all"
                    disabled={loading}
                  />
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-popover border-2 border-accent-cool/30 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto animate-scale-in backdrop-blur-sm"
                    >
                      {loadingSuggestions ? (
                        <div className="p-3 text-center text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                          Searching...
                        </div>
                      ) : (
                        suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-accent-cool/10 transition-all duration-200 border-b border-border/50 last:border-b-0 focus:bg-accent-cool/10 focus:outline-none focus:ring-2 focus:ring-accent-cool/20 rounded-sm"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-accent-cool" />
                            <span className="text-popover-foreground text-xs sm:text-sm font-medium truncate">
                                {suggestion.display_name}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  variant="outline"
                size="sm"
                className="h-8 sm:h-9 md:h-10 border-2 border-accent-cool/60 hover:bg-accent-cool/10 hover:border-accent-cool transition-all duration-300 flex-shrink-0"
                >
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-accent-cool" />
                </Button>
            </form>
            {weather && (
                <Button
                      type="button"
                onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 md:h-10 border-2 border-accent-cool/50 hover:bg-accent-cool/10 hover:border-accent-cool transition-all font-semibold text-xs sm:text-sm flex-shrink-0"
              >
                °{unit}
              </Button>
            )}
            <div className="flex-shrink-0">
              <ThemeToggle />
                        </div>
                  </div>
                </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-slide-up shadow-lg">
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Grid Layout */}
        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Current Weather Card - Top Left */}
          <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-cool/10 shadow-2xl hover:shadow-2xl transition-all duration-500 animate-slide-up">
              <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-accent-cool" />
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-muted-foreground truncate">
                      {weather.city}, {weather.country}
                    </p>
                </div>
                  
                  {/* Temperature and Icon */}
                  <div className="flex items-center gap-3 sm:gap-4">
                {weather.icon && (
                      <div className="relative flex-shrink-0">
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.description}
                          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-2xl"
                    />
                  </div>
                )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${
                    convertTemp(weather.temperature) >= 25 
                      ? 'text-accent-warm' 
                      : convertTemp(weather.temperature) <= 10 
                      ? 'text-accent-cool' 
                      : 'bg-gradient-to-r from-accent-cool to-accent-warm bg-clip-text text-transparent'
                  }`}>
                        {convertTemp(weather.temperature)}°{unit}
                  </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        /{convertTemp(forecast?.forecast?.[0]?.low_temp ?? weather.temperature)}°{unit}
                  </p>
                </div>
              </div>

              {/* Description */}
                  <p className="text-base sm:text-lg md:text-xl font-bold capitalize">
                  {weather.description}
                </p>

                  {/* Feels Like */}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Feels like {convertTemp(weather.feels_like)}°{unit}
                      </p>
                    </div>
                  </CardContent>
                </Card>

            {/* Today's Highlights Card - Top Right */}
            <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-purple/5 shadow-2xl hover:shadow-2xl transition-all duration-500 animate-slide-up">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg md:text-xl font-extrabold">Today's Highlight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Wind Status */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-accent-cool flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Wind Status</p>
                      </div>
                    <p className="text-lg sm:text-xl font-extrabold text-foreground">
                      {weather.wind_speed.toFixed(2)} km/h
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatTime(new Date().toISOString(), weather.timezone)}
                      </p>
                    </div>

                  {/* Humidity */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-accent-cool flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Humidity</p>
                        </div>
                    <p className="text-lg sm:text-xl font-extrabold text-foreground">
                      {Math.round(weather.humidity)}%
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {getHumidityDescription(weather.humidity)}
                        </p>
                      </div>

                  {/* UV Index */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-accent-warm flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">UV Index</p>
                        </div>
                    <p className="text-lg sm:text-xl font-extrabold text-foreground">
                      {Math.round(weather.uv_index || 0)} uv
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {getUVDescription(weather.uv_index || 0)}
                        </p>
                      </div>

                  {/* Visibility */}
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-accent-cool flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Visibility</p>
                        </div>
                    <p className="text-lg sm:text-xl font-extrabold text-foreground">
                      {weather.visibility?.toFixed(1) || '10'} km
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatTime(new Date().toISOString(), weather.timezone)}
                        </p>
                      </div>
                </div>

                {/* Sunrise/Sunset */}
                {weather.sunrise && weather.sunset && (
                  <div className="flex items-center justify-center gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-accent-cool/20">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent-warm flex-shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Sunrise</p>
                        <p className="text-xs sm:text-sm font-semibold">{formatTime(weather.sunrise, weather.timezone)}</p>
                          </div>
                        </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-accent-cool flex-shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Sunset</p>
                        <p className="text-xs sm:text-sm font-semibold">{formatTime(weather.sunset, weather.timezone)}</p>
                          </div>
                        </div>
              </div>
                )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Hourly Forecast Block */}
        {hourlyForecast && hourlyForecast.hourly.length > 0 && (
          <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-purple/5 shadow-2xl hover:shadow-2xl transition-all duration-300 animate-slide-up">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl font-extrabold">Hourly Forecast</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="overflow-x-auto pb-2 scrollbar-thin -mx-2 sm:mx-0">
                <div className="flex gap-2 sm:gap-3 min-w-max px-2 sm:px-0">
                  {hourlyForecast.hourly.slice(0, 24).map((hour, index) => (
                          <div
                            key={index}
                      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg bg-gradient-to-br from-secondary/50 to-accent-cool/10 border border-accent-cool/20 min-w-[65px] sm:min-w-[75px] md:min-w-[85px] hover:bg-accent-cool/20 hover:border-accent-cool/40 transition-all duration-300"
                          >
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {hour.time}
                            </p>
                            <img
                              src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                              alt={hour.description}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                      />
                      <p className="font-extrabold text-xs sm:text-sm md:text-base text-foreground">
                        {convertTemp(hour.temperature)}°{unit}
                      </p>
                          </div>
                        ))}
                      </div>
                    </div>
              </CardContent>
          </Card>
        )}

        {/* 7-Day Forecast Block */}
        {forecast && forecast.forecast.length > 0 && (
          <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-warm/5 shadow-2xl hover:shadow-2xl transition-all duration-300 animate-slide-up">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg md:text-xl font-extrabold">7 Day Forecast</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="overflow-x-auto pb-2 scrollbar-thin -mx-2 sm:mx-0">
                <div className="flex gap-2 sm:gap-3 min-w-max px-2 sm:px-0">
                  {forecast.forecast.slice(0, 7).map((day, index) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg bg-gradient-to-br from-secondary/50 to-accent-cool/10 border border-accent-cool/20 min-w-[80px] sm:min-w-[90px] md:min-w-[100px] hover:bg-accent-cool/20 hover:border-accent-cool/40 transition-all duration-300"
                    >
                      <p className="font-bold text-xs sm:text-sm md:text-base text-foreground">
                        {index === 0 ? 'Today' : day.day_name.slice(0, 3)}
                      </p>
                          <img
                            src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                            alt={day.description}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                      />
                      <p className="font-extrabold text-sm sm:text-base md:text-lg text-foreground">
                        {convertTemp(day.high_temp)}°{unit}
                          </p>
                        </div>
                  ))}
                      </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Locations/Updates Block */}
        {recentSearches.length > 0 && (
          <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-warm/5 shadow-2xl hover:shadow-2xl transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl font-extrabold">Other Locations</CardTitle>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([])
                    setRecentWeatherCards([])
                    localStorage.removeItem('weather-recent-searches')
                  }}
                  className="text-xs text-muted-foreground hover:text-accent-warm transition-all"
                >
                  See All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSearches.slice(0, 2).map((search, index) => {
                  const cardData = recentWeatherCards.find(card => 
                    card.location.toLowerCase().includes(search.toLowerCase()) || 
                    search.toLowerCase().includes(card.location.toLowerCase())
                  )
                  const isLoading = loadingRecentCards[search]
                  
                  return (
                    <div 
                      key={index}
                      className="cursor-pointer hover:scale-[1.02] transition-all duration-300"
                      onClick={() => {
                        setCity(search)
                        fetchWeather(search)
                      }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-secondary/50">
                          <Loader2 className="w-4 h-4 animate-spin text-accent-cool" />
                          <span className="text-xs text-muted-foreground">Loading...</span>
                        </div>
                      ) : cardData ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-secondary to-accent-cool/5 border-2 border-accent-cool/20 hover:border-accent-cool transition-all">
                          <img
                            src={`https://openweathermap.org/img/wn/${cardData.icon}@2x.png`}
                            alt={cardData.condition}
                            className="w-10 h-10"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{cardData.location.split(',')[0]}</p>
                            <p className="text-xs text-muted-foreground">{cardData.condition}</p>
                          </div>
                        <div className="text-right">
                            <p className="text-lg font-extrabold text-accent-warm">
                              {cardData.high}°{cardData.unit}
                          </p>
                            <p className="text-sm text-muted-foreground">
                              {cardData.low}°{cardData.unit}
                          </p>
                        </div>
                      </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-secondary/50 text-center text-xs text-muted-foreground">
                          {search}
                    </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!weather && !error && !loading && (
          <Card className="card-bright border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-cool/5 shadow-2xl animate-fade-in">
            <CardContent className="pt-6 sm:pt-8">
              <div className="text-center py-12 sm:py-16 md:py-20 space-y-4 sm:space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-cool/30 to-accent-warm/30 rounded-full blur-2xl"></div>
                  <Cloud className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-accent-cool mx-auto animate-pulse-slow" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-foreground text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-accent-cool to-accent-warm bg-clip-text text-transparent">
                    Enter a city name to get started
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base font-medium">
                    Discover weather conditions around the world
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

