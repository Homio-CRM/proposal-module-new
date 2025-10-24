'use client'

import React, { forwardRef } from 'react'
import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ptBR } from 'date-fns/locale'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  error?: boolean
}

const CustomDatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Selecione uma data", 
    className,
    disabled = false,
    minDate,
    maxDate,
    error = false
  }, ref) => {
    const [open, setOpen] = useState(false)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal flex h-10 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900",
              !value && "text-neutral-500",
              error && "border-red-500",
              className
            )}
            disabled={disabled}
            ref={ref}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-neutral-400" />
            {value ? value.toLocaleDateString('pt-BR') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => { 
              if (d) {
                const adjusted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
                onChange(adjusted);
              } else {
                onChange(null);
              }
              setOpen(false);
            }}
            locale={ptBR}
            disabled={(date) =>
              Boolean((minDate && date < minDate) || (maxDate && date > maxDate))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)

CustomDatePicker.displayName = "CustomDatePicker"

export { CustomDatePicker }
