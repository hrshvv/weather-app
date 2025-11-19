"use client"

import * as React from "react"
import type { GetWeatherResult } from "@/components/ui/component"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Droplets, Wind, TrendingUp, TrendingDown } from "lucide-react"

export function WeatherCard({ data }: { data?: GetWeatherResult }) {
  if (!data) {
    return (
      <Card className="w-full border-2 border-accent-cool/30 bg-gradient-to-br from-card to-accent-cool/5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Weather</CardTitle>
          <CardDescription className="text-xs">Powered by your tool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs sm:text-sm text-muted-foreground">
            No data yet. Pass <code>GetWeatherResult</code>.
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    location,
    temperature,
    unit,
    condition,
    high,
    low,
    humidity,
    windKph,
    icon,
  } = data

  return (
    <Card className="w-full border-2 border-accent-cool/30 bg-gradient-to-br from-card via-card to-accent-cool/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-sm font-bold text-accent-cool">
          {location}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-3 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          {icon && (
            <img
              src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
              alt={condition}
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
          )}
          <div className="flex-1 text-right">
            <div className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${
              temperature >= 25 
                ? 'text-accent-warm' 
                : temperature <= 10 
                ? 'text-accent-cool' 
                : 'bg-gradient-to-r from-accent-cool to-accent-warm bg-clip-text text-transparent'
            }`}>
              {temperature}°{unit}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground font-medium capitalize mt-0.5">
              {condition}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
          <div className="rounded-md bg-gradient-to-br from-secondary to-accent-warm/10 p-2 text-center border border-accent-warm/20">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-accent-warm" />
              <div className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">High</div>
            </div>
            <div className="font-extrabold text-accent-warm text-xs sm:text-sm">
              {high}°{unit}
            </div>
          </div>
          <div className="rounded-md bg-gradient-to-br from-secondary to-accent-cool/10 p-2 text-center border border-accent-cool/20">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingDown className="w-3 h-3 text-accent-cool" />
              <div className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">Low</div>
            </div>
            <div className="font-extrabold text-accent-cool text-xs sm:text-sm">
              {low}°{unit}
            </div>
          </div>
          <div className="rounded-md bg-gradient-to-br from-secondary to-accent-cool/10 p-2 text-center border border-accent-cool/20">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Droplets className="w-3 h-3 text-accent-cool" />
              <div className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">Humidity</div>
            </div>
            <div className="font-extrabold text-accent-cool text-xs sm:text-sm">
              {Math.round(humidity * 100)}%
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-muted-foreground pt-1 border-t border-accent-cool/20">
          <Wind className="w-3 h-3 text-accent-cool" />
          <span className="font-semibold">Wind: {windKph} km/h</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default WeatherCard
