'use client'

import React, { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  showTimeSelect?: boolean
  timeFormat?: string
  dateFormat?: string
  error?: boolean
}

const CustomDatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Selecione uma data", 
    className,
    disabled = false,
    minDate,
    maxDate,
    showTimeSelect = false,
    timeFormat = "HH:mm",
    dateFormat = "dd/MM/yyyy",
    error = false,
    ...props 
  }, ref) => {
    return (
      <div className="relative">
        <DatePicker
          selected={value}
          onChange={onChange}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          dateFormat={showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat}
          className={cn(
            "flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "error",
            className
          )}
          wrapperClassName="w-full"
          {...props}
        />
        <Calendar className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
      </div>
    )
  }
)

CustomDatePicker.displayName = "CustomDatePicker"

export { CustomDatePicker }
