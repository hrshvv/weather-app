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
  Eye,
  Sun,
  Moon,
  Clock,
  Navigation,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import WeatherCard from '@/components/weather-card'
import type { GetWeatherResult } from '@/components/ui/component'

interface WeatherData {
  city: string
  country: string
  temperature: number
  feels_like: number
  description: string
  humidity: number
  wind_speed: number
  icon: string
  pressure?: number
  visibility?: number
  sunrise?: number
  sunset?: number
  timezone?: number
}

interface ForecastDay {
  date: string
  day_name: string
  short_date: string
  high_temp: number
  low_temp: number
  icon: string
  description: string
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
  precipitation: number
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
  const [recentWeatherCards, setRecentWeatherCards] = useState<WeatherData[]>([])
  const [loadingRecentCards, setLoadingRecentCards] = useState<{ [key: string]: boolean }>({})
  const [showHourly, setShowHourly] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchCitySuggestions = useCallback(async (query: string) => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/search-cities?q=${encodeURIComponent(query)}&limit=5`
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
      const response = await fetch(`http://127.0.0.1:5000/get-weather?city=${encodeURIComponent(cityName)}`)
      if (response.ok) {
        const weatherData: WeatherData = await response.json()
        
        // Convert to GetWeatherResult format
        const cardData: GetWeatherResult = {
          location: `${weatherData.city}, ${weatherData.country}`,
          unit: unit,
          temperature: convertTemp(weatherData.temperature),
          condition: weatherData.description,
          high: convertTemp(weatherData.temperature + 5), // Approximate high
          low: convertTemp(weatherData.temperature - 5), // Approximate low
          humidity: weatherData.humidity / 100, // Convert to 0-1 range
          windKph: Math.round(weatherData.wind_speed * 3.6), // Convert m/s to km/h
          icon: weatherData.icon
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

  // Format time from timestamp
  const formatTime = (timestamp: number, timezone: number = 0): string => {
    const date = new Date((timestamp + timezone) * 1000)
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
      // Parse date and time - format is YYYY-MM-DD and HH:MM
      const [year, month, day] = hour.date.split('-').map(Number)
      const [hourNum, minute] = hour.time.split(':').map(Number)
      const hourDate = new Date(year, month - 1, day, hourNum, minute)
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
          const [weatherResponse, forecastResponse, hourlyResponse] = await Promise.all([
            fetch(`http://127.0.0.1:5000/get-weather?lat=${latitude}&lon=${longitude}`),
            fetch(`http://127.0.0.1:5000/get-forecast?lat=${latitude}&lon=${longitude}`),
            fetch(`http://127.0.0.1:5000/get-hourly?lat=${latitude}&lon=${longitude}`)
          ])

          if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data')
          }

          // Handle forecast response - may fail if One Call API not subscribed
          let forecastData: ForecastData | null = null
          if (forecastResponse.ok) {
            forecastData = await forecastResponse.json()
          }

          // Handle hourly response - may fail if One Call API not subscribed
          let hourlyData: HourlyForecast | null = null
          if (hourlyResponse.ok) {
            hourlyData = await hourlyResponse.json()
          }

          const weatherData: WeatherData = await weatherResponse.json()

          setWeather(weatherData)
          setForecast(forecastData)
          setHourlyForecast(hourlyData)
          if (hourlyData && hourlyData.hourly.length > 0) {
            setShowHourly(true)
          }
          setCity(`${weatherData.city}, ${weatherData.country}`)
          saveRecentSearch(`${weatherData.city}, ${weatherData.country}`)
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
    setCity(suggestion.display_name)
    setShowSuggestions(false)
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
      // Make requests: current weather, forecast, and hourly
      const [weatherResponse, forecastResponse, hourlyResponse] = await Promise.all([
        fetch(`http://127.0.0.1:5000/get-weather?city=${encodeURIComponent(searchCity)}`),
        fetch(`http://127.0.0.1:5000/get-forecast?city=${encodeURIComponent(searchCity)}`),
        fetch(`http://127.0.0.1:5000/get-hourly?city=${encodeURIComponent(searchCity)}`)
      ])

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json()
        throw new Error(errorData.error || 'Failed to fetch weather data')
      }

      // Handle forecast response - may fail if One Call API not subscribed
      let forecastData: ForecastData | null = null
      if (forecastResponse.ok) {
        forecastData = await forecastResponse.json()
      } else {
        const errorData = await forecastResponse.json()
        // Don't throw error for forecast, just log it
        console.warn('Forecast data unavailable:', errorData.error)
        if (errorData.error?.includes('One Call API subscription')) {
          setError('Forecast unavailable: One Call API 3.0 subscription required. Please subscribe in your OpenWeatherMap account.')
        }
      }

      // Handle hourly response - may fail if One Call API not subscribed
      let hourlyData: HourlyForecast | null = null
      if (hourlyResponse.ok) {
        hourlyData = await hourlyResponse.json()
      } else {
        const errorData = await hourlyResponse.json()
        // Don't throw error for hourly, just log it
        console.warn('Hourly data unavailable:', errorData.error)
      }

      const weatherData: WeatherData = await weatherResponse.json()
      
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

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background transition-colors duration-300">
      <div className="w-full max-w-4xl space-y-6 animate-fade-in">
        {/* Header Card */}
        <Card className="border-accent-cool/40 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div>
              <CardTitle className="text-4xl sm:text-5xl font-bold text-foreground flex items-center justify-center gap-3 flex-1 tracking-tight">
                <Cloud className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-accent-cool" />
                Weather App
              </CardTitle>
              <div className="flex-1 flex justify-end">
                <ThemeToggle />
              </div>
            </div>
            <CardDescription className="text-muted-foreground text-base sm:text-lg">
              Get real-time weather information for any city worldwide
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search Card */}
        <Card className="border-accent-cool/40 bg-card shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent-cool z-10" />
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
                    placeholder="Enter city name..."
                    className="pl-10"
                    disabled={loading}
                  />
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto animate-scale-in"
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
                            className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0 focus:bg-accent focus:outline-none"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-accent-cool" />
                              <span className="text-popover-foreground text-sm">
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
                  size="lg"
                  className="hover:bg-accent transition-all duration-300 border-2 border-accent-cool/60"
                >
                  <Navigation className="w-4 h-4 text-accent-cool" />
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-foreground text-background hover:bg-accent-warm/40 dark:hover:bg-accent-cool/40 transition-all duration-300 shadow-md hover:shadow-lg border-2 border-accent-cool/50 dark:border-accent-cool/60"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-muted-foreground text-sm font-medium">Recent Searches:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([])
                        setRecentWeatherCards([])
                        localStorage.removeItem('weather-recent-searches')
                      }}
                      className="text-xs px-2 py-1 text-muted-foreground hover:text-accent-warm transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentSearches.map((search, index) => {
                      const cardData = recentWeatherCards.find(card => card.location === search)
                      const isLoading = loadingRecentCards[search]
                      
                      return (
                        <div key={index} className="relative">
                          {isLoading ? (
                            <Card className="border-accent-cool/40 bg-card shadow-lg">
                              <CardContent className="pt-6 pb-6">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-accent-cool" />
                                  <span className="text-sm text-muted-foreground">Loading...</span>
                                </div>
                              </CardContent>
                            </Card>
                          ) : cardData ? (
                            <div 
                              className="cursor-pointer hover:scale-105 transition-transform duration-300"
                              onClick={() => {
                                setCity(search)
                                fetchWeather(search)
                              }}
                            >
                              <WeatherCard data={cardData} />
                            </div>
                          ) : (
                            <Card className="border-accent-cool/40 bg-card shadow-lg">
                              <CardContent className="pt-6 pb-6">
                                <div className="text-sm text-muted-foreground text-center">
                                  {search}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-slide-up shadow-lg">
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Weather Card */}
        {weather && (
          <Card className="border-accent-cool/20 bg-card shadow-2xl hover:shadow-2xl transition-all duration-500 animate-slide-up">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-cool" />
                  <CardTitle className="text-2xl sm:text-3xl font-bold">
                    {weather.city}, {weather.country}
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                  variant="outline"
                  size="sm"
                  className="hover:bg-accent transition-colors"
                >
                  °{unit}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Main Temperature Display */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                {weather.icon && (
                  <div className="relative animate-scale-in">
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.description}
                      className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-lg grayscale transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                )}
                <div className="text-center">
                  <p className={`text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight ${
                    convertTemp(weather.temperature) >= 25 
                      ? 'text-accent-warm' 
                      : convertTemp(weather.temperature) <= 10 
                      ? 'text-accent-cool' 
                      : 'text-foreground'
                  }`}>
                    {convertTemp(weather.temperature)}°
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base mt-2">
                    Feels like {convertTemp(weather.feels_like)}°{unit}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="text-center">
                <p className="text-xl sm:text-2xl text-foreground capitalize font-semibold tracking-wide">
                  {weather.description}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <Card className="border-accent-cool/50 bg-secondary hover:bg-accent-cool/20 transition-all duration-300 hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-2">
                      <Droplets className="w-8 h-8 text-accent-cool" />
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Humidity</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {weather.humidity}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-accent-cool/50 bg-secondary hover:bg-accent-cool/20 transition-all duration-300 hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-2">
                      <Wind className="w-8 h-8 text-accent-cool" />
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Wind Speed</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {weather.wind_speed} <span className="text-sm font-normal">m/s</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {weather.pressure && (
                  <Card className="border-accent-warm/50 bg-secondary hover:bg-accent-warm/20 transition-all duration-300 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Gauge className="w-8 h-8 text-accent-warm" />
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Pressure</p>
                        <p className="text-2xl sm:text-3xl font-bold">
                          {weather.pressure} <span className="text-sm font-normal">hPa</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {weather.visibility !== undefined && weather.visibility !== null && (
                  <Card className="border-accent-success/50 bg-secondary hover:bg-accent-success/20 transition-all duration-300 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center gap-2">
                        <Eye className="w-8 h-8 text-accent-success" />
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Visibility</p>
                        <p className="text-2xl sm:text-3xl font-bold">
                          {weather.visibility} <span className="text-sm font-normal">km</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {weather.sunrise && weather.sunset && (
                  <>
                    <Card className="border-accent-warm/50 bg-secondary hover:bg-accent-warm/20 transition-all duration-300 hover:shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-2">
                          <Sun className="w-8 h-8 text-accent-warm" />
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Sunrise</p>
                          <p className="text-lg sm:text-xl font-bold">
                            {formatTime(weather.sunrise, weather.timezone)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-accent-cool/50 bg-secondary hover:bg-accent-cool/20 transition-all duration-300 hover:shadow-md">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-2">
                          <Moon className="w-8 h-8 text-accent-cool" />
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Sunset</p>
                          <p className="text-lg sm:text-xl font-bold">
                            {formatTime(weather.sunset, weather.timezone)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Forecast Card */}
        {hourlyForecast && hourlyForecast.hourly.length > 0 && (
          <Card className="border-accent-cool/40 bg-card shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent-cool" />
                    48-Hour Forecast ({hourlyForecast.hourly.length} hours)
                  </CardTitle>
                  <span className="text-xs text-muted-foreground bg-accent-cool/20 px-2 py-1 rounded-full">
                    One Call API 3.0
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowHourly(!showHourly)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent transition-colors"
                >
                  {showHourly ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showHourly && (
              <CardContent className="space-y-6">
                {groupHourlyByDay(hourlyForecast.hourly).map((dayGroup, dayIndex) => (
                  <div key={dayIndex} className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {dayGroup.label}
                    </h3>
                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                      <div className="flex gap-2 sm:gap-3 min-w-max">
                        {dayGroup.hours.map((hour, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-secondary border border-border min-w-[90px] sm:min-w-[100px] hover:bg-accent transition-all duration-300 hover:shadow-md hover:scale-105"
                            title={`${hour.description} | Humidity: ${hour.humidity}% | Wind: ${hour.wind_speed} m/s`}
                          >
                            <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {hour.time}
                            </p>
                            <img
                              src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                              alt={hour.description}
                              className="w-10 h-10 sm:w-12 sm:h-12 grayscale transition-transform duration-300"
                            />
                            <p className="font-bold text-base sm:text-lg">
                              {convertTemp(hour.temperature)}°
                            </p>
                            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                              {hour.precipitation > 0 && (
                                <p className="flex items-center gap-1">
                                  <Droplets className="w-3 h-3" />
                                  {hour.precipitation.toFixed(1)}mm
                                </p>
                              )}
                              <p className="text-[10px] opacity-75">
                                {hour.humidity}% | {hour.wind_speed.toFixed(1)}m/s
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}


        {/* 8-Day Forecast Card */}
        {forecast && forecast.forecast.length > 0 && (
          <Card className="border-accent-cool/40 bg-card shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  8-Day Forecast
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-accent-cool/20 px-2 py-1 rounded-full">
                  One Call API 3.0
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {forecast.forecast.map((day, index) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-4 sm:p-5 rounded-lg bg-secondary border border-border hover:bg-accent transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                  >
                    {/* Day Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-20 sm:w-24 flex-shrink-0">
                        <p className="font-semibold text-sm sm:text-base">
                          {index === 0 ? 'Today' : day.day_name}
                        </p>
                        <p className="text-muted-foreground text-xs">{day.short_date}</p>
                      </div>
                      
                      {/* Weather Icon */}
                      <div className="flex-shrink-0">
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.description}
                          className="w-12 h-12 sm:w-14 sm:h-14 grayscale transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                      
                      {/* Description */}
                      <div className="flex-1 hidden sm:block min-w-0">
                        <p className="text-sm capitalize truncate">
                          {day.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Temperature Range */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg sm:text-xl">
                          {convertTemp(day.high_temp)}°
                        </p>
                        <p className="text-muted-foreground text-sm sm:text-base">
                          {convertTemp(day.low_temp)}°
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!weather && !error && !loading && (
          <Card className="border-border bg-card shadow-lg animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center py-16 sm:py-20 space-y-4">
                <Cloud className="w-20 h-20 sm:w-24 sm:h-24 text-accent-cool mx-auto animate-pulse" />
                <div className="space-y-2">
                  <p className="text-foreground text-xl sm:text-2xl font-semibold">
                    Enter a city name to get started
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base">
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

