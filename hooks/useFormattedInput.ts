import { useState, useCallback } from 'react'

interface UseFormattedInputOptions {
  format: (value: string) => string
  maxLength?: number
}

export function useFormattedInput({ format, maxLength }: UseFormattedInputOptions) {
  const [value, setValue] = useState('')

  const handleChange = useCallback((inputValue: string) => {
    // Remove todos os caracteres não numéricos
    const numbersOnly = inputValue.replace(/\D/g, '')
    
    // Aplica o limite de caracteres se especificado
    const limitedValue = maxLength ? numbersOnly.slice(0, maxLength) : numbersOnly
    
    // Aplica a formatação
    const formattedValue = format(limitedValue)
    
    setValue(formattedValue)
    return formattedValue
  }, [format, maxLength])

  return {
    value,
    setValue,
    handleChange
  }
}

// Funções de formatação específicas
export const formatCPF = (value: string): string => {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const formatCEP = (value: string): string => {
  return value.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export const formatPhone = (value: string): string => {
  if (value.length <= 10) {
    return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}

