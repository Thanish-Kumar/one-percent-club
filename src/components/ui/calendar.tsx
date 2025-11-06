"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  highlightedDates?: string[] // ISO date strings (YYYY-MM-DD)
  minDate?: Date // Minimum selectable date (e.g., account creation date)
  maxDate?: Date // Maximum selectable date (typically today)
  className?: string
}

export function Calendar({
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const formatDateToISO = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const minDateMidnight = new Date(minDate)
      minDateMidnight.setHours(0, 0, 0, 0)
      const dateMidnight = new Date(date)
      dateMidnight.setHours(0, 0, 0, 0)
      if (dateMidnight < minDateMidnight) return true
    }
    
    if (maxDate) {
      const maxDateMidnight = new Date(maxDate)
      maxDateMidnight.setHours(0, 0, 0, 0)
      const dateMidnight = new Date(date)
      dateMidnight.setHours(0, 0, 0, 0)
      if (dateMidnight > maxDateMidnight) return true
    }
    
    return false
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    
    // Don't allow selecting disabled dates
    if (isDateDisabled(newDate)) return
    
    onDateSelect(newDate)
  }

  const renderCalendarDays = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10" />
      )
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      )
      const dateISO = formatDateToISO(date)
      const isSelected = isSameDay(date, selectedDate)
      const isTodayDate = isToday(date)
      const hasEntry = highlightedDates.includes(dateISO)
      const disabled = isDateDisabled(date)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={cn(
            "h-10 w-10 rounded-md text-sm font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isTodayDate && !isSelected && "border-2 border-primary",
            hasEntry && !isSelected && "bg-accent/50 font-semibold",
            disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-current"
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className={cn("p-4 bg-card border border-border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-10 w-10 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-accent/50" />
          <span>Has entry</span>
        </div>
      </div>
    </div>
  )
}

