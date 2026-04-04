"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Calendar } from "./Calendar"
import { Input } from "./Input"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜와 시간을 선택하세요",
  disabled,
  minDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = React.useState<string>(
    value ? format(value, "HH:mm") : ""
  )
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedTime(format(value, "HH:mm"))
    } else {
      setSelectedDate(undefined)
      setSelectedTime("")
    }
  }, [value])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    } else if (date) {
      const now = new Date()
      date.setHours(now.getHours(), now.getMinutes())
      setSelectedTime(format(date, "HH:mm"))
      onChange(date)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (selectedDate && time) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    }
  }

  const displayValue = value
    ? format(value, "yyyy년 MM월 dd일 HH:mm", { locale: ko })
    : placeholder

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-auto bg-background border border-border rounded-md shadow-lg p-4">
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={minDate ? (date) => date < minDate : undefined}
              initialFocus
            />
            
            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4" />
                시간 선택
              </label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                닫기
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={!selectedDate || !selectedTime}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
