'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface FormattedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  format?: (value: string) => string
  maxLength?: number
}

const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ className, type, format, maxLength, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value
      
      if (format) {
        // Remove todos os caracteres não numéricos
        const numbersOnly = inputValue.replace(/\D/g, '')
        
        // Aplica o limite de caracteres se especificado
        const limitedValue = maxLength ? numbersOnly.slice(0, maxLength) : numbersOnly
        
        // Aplica a formatação
        inputValue = format(limitedValue)
      }
      
      // Cria um novo evento com o valor formatado
      const formattedEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      }
      
      onChange?.(formattedEvent as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
FormattedInput.displayName = "FormattedInput"

export { FormattedInput }
