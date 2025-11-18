// WMO Weather Code mapping
// Based on https://open-meteo.com/en/docs#weathervariables

export interface WeatherCodeInfo {
  description: string
  icon: string
}

export function getWeatherCodeInfo(code: number): WeatherCodeInfo {
  // Map WMO weather codes to descriptions and icons
  // Using OpenWeatherMap icon naming convention for compatibility
  const codeMap: { [key: number]: WeatherCodeInfo } = {
    0: { description: 'Clear sky', icon: '01d' },
    1: { description: 'Mainly clear', icon: '02d' },
    2: { description: 'Partly cloudy', icon: '02d' },
    3: { description: 'Overcast', icon: '04d' },
    45: { description: 'Foggy', icon: '50d' },
    48: { description: 'Depositing rime fog', icon: '50d' },
    51: { description: 'Light drizzle', icon: '09d' },
    53: { description: 'Moderate drizzle', icon: '09d' },
    55: { description: 'Dense drizzle', icon: '09d' },
    56: { description: 'Light freezing drizzle', icon: '09d' },
    57: { description: 'Dense freezing drizzle', icon: '09d' },
    61: { description: 'Slight rain', icon: '10d' },
    63: { description: 'Moderate rain', icon: '10d' },
    65: { description: 'Heavy rain', icon: '10d' },
    66: { description: 'Light freezing rain', icon: '10d' },
    67: { description: 'Heavy freezing rain', icon: '10d' },
    71: { description: 'Slight snow fall', icon: '13d' },
    73: { description: 'Moderate snow fall', icon: '13d' },
    75: { description: 'Heavy snow fall', icon: '13d' },
    77: { description: 'Snow grains', icon: '13d' },
    80: { description: 'Slight rain showers', icon: '09d' },
    81: { description: 'Moderate rain showers', icon: '09d' },
    82: { description: 'Violent rain showers', icon: '09d' },
    85: { description: 'Slight snow showers', icon: '13d' },
    86: { description: 'Heavy snow showers', icon: '13d' },
    95: { description: 'Thunderstorm', icon: '11d' },
    96: { description: 'Thunderstorm with slight hail', icon: '11d' },
    99: { description: 'Thunderstorm with heavy hail', icon: '11d' },
  }

  return codeMap[code] || { description: 'Unknown', icon: '01d' }
}

export function formatDate(dateString: string): { dayName: string; shortDate: string } {
  const date = new Date(dateString)
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { dayName, shortDate }
}

export function parseISO8601Time(timeString: string): Date {
  return new Date(timeString)
}

export function formatTimeFromISO8601(timeString: string): string {
  const date = parseISO8601Time(timeString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

