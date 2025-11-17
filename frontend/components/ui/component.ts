export interface GetWeatherResult {
  location: string
  unit: "C" | "F"
  temperature: number
  condition: string
  high: number
  low: number
  humidity: number // 0-1 range
  windKph: number
  icon?: string
}

