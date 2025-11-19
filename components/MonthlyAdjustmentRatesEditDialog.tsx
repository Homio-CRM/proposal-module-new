'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { buildingService } from '@/lib/services/buildingService'
import { Unit } from '@/lib/types/building'
import { Plus, Trash2 } from 'lucide-react'

interface MonthlyAdjustmentRatesEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onUpdated?: (updatedUnit: Unit) => void
}

interface RateFormData {
  id?: string
  year: number
  january_rate: number
  february_rate: number
  march_rate: number
  april_rate: number
  may_rate: number
  june_rate: number
  july_rate: number
  august_rate: number
  september_rate: number
  october_rate: number
  november_rate: number
  december_rate: number
}

interface RateFormInputs {
  [key: string]: string
}

const MONTHS = [
  { key: 'january_rate', label: 'Janeiro' },
  { key: 'february_rate', label: 'Fevereiro' },
  { key: 'march_rate', label: 'Março' },
  { key: 'april_rate', label: 'Abril' },
  { key: 'may_rate', label: 'Maio' },
  { key: 'june_rate', label: 'Junho' },
  { key: 'july_rate', label: 'Julho' },
  { key: 'august_rate', label: 'Agosto' },
  { key: 'september_rate', label: 'Setembro' },
  { key: 'october_rate', label: 'Outubro' },
  { key: 'november_rate', label: 'Novembro' },
  { key: 'december_rate', label: 'Dezembro' }
] as const

export default function MonthlyAdjustmentRatesEditDialog({ 
  open, 
  onOpenChange, 
  unit, 
  onUpdated 
}: MonthlyAdjustmentRatesEditDialogProps) {
  const [rates, setRates] = useState<RateFormData[]>([])
  const [rateInputs, setRateInputs] = useState<RateFormInputs>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const formatRateInput = (value: string): string => {
    value = value.replace(/[^\d,]/g, '')
    const parts = value.split(',')
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('')
    }
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + ',' + parts[1].substring(0, 2)
    }
    return value
  }

  const formatRateForDisplay = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return ''
    return (value * 100).toFixed(2).replace('.', ',')
  }

  const parseRateFromInput = (value: string): number => {
    if (!value || value.trim() === '') return 0
    const normalized = value.replace(',', '.')
    const parsed = parseFloat(normalized)
    if (isNaN(parsed)) return 0
    return parsed / 100
  }

  useEffect(() => {
    if (unit && open) {
      if (unit.monthly_adjustment_rates && unit.monthly_adjustment_rates.length > 0) {
        const newRates = unit.monthly_adjustment_rates.map(rate => ({
          id: rate.id,
          year: rate.year,
          january_rate: rate.january_rate,
          february_rate: rate.february_rate,
          march_rate: rate.march_rate,
          april_rate: rate.april_rate,
          may_rate: rate.may_rate,
          june_rate: rate.june_rate,
          july_rate: rate.july_rate,
          august_rate: rate.august_rate,
          september_rate: rate.september_rate,
          october_rate: rate.october_rate,
          november_rate: rate.november_rate,
          december_rate: rate.december_rate
        }))
        setRates(newRates)
        
        const newInputs: RateFormInputs = {}
        newRates.forEach((rate, index) => {
          MONTHS.forEach(month => {
            const monthKey = month.key as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
            newInputs[`${index}_${monthKey}`] = formatRateForDisplay(rate[monthKey])
          })
        })
        setRateInputs(newInputs)
      } else {
        setRates([])
        setRateInputs({})
      }
      setErrors({})
      setFormError('')
    }
  }, [unit, open])

  const addYear = () => {
    const currentYear = new Date().getFullYear()
    const existingYears = rates.map(r => r.year)
    let newYear = currentYear
    while (existingYears.includes(newYear)) {
      newYear++
    }
    
    const newIndex = rates.length
    const newRate = {
      year: newYear,
      january_rate: 0,
      february_rate: 0,
      march_rate: 0,
      april_rate: 0,
      may_rate: 0,
      june_rate: 0,
      july_rate: 0,
      august_rate: 0,
      september_rate: 0,
      october_rate: 0,
      november_rate: 0,
      december_rate: 0
    }
    
    setRates([...rates, newRate])
    
    const newInputs: RateFormInputs = { ...rateInputs }
    MONTHS.forEach(month => {
      const monthKey = month.key as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
      newInputs[`${newIndex}_${monthKey}`] = ''
    })
    setRateInputs(newInputs)
  }

  const removeYear = (index: number) => {
    const newRates = rates.filter((_, i) => i !== index)
    setRates(newRates)
    
    const newInputs: RateFormInputs = {}
    newRates.forEach((rate, newIndex) => {
      MONTHS.forEach(month => {
        const monthKey = month.key as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
        newInputs[`${newIndex}_${monthKey}`] = formatRateForDisplay(rate[monthKey])
      })
    })
    setRateInputs(newInputs)
  }

  const updateRate = (index: number, field: keyof RateFormData, value: string | number) => {
    const newRates = [...rates]
    if (field === 'year') {
      newRates[index].year = typeof value === 'number' ? value : parseInt(value.toString()) || 0
      setRates(newRates)
    } else {
      const monthKey = field as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
      const inputKey = `${index}_${monthKey}`
      
      if (typeof value === 'string') {
        const formatted = formatRateInput(value)
        setRateInputs(prev => ({ ...prev, [inputKey]: formatted }))
        newRates[index][monthKey] = parseRateFromInput(formatted)
        setRates(newRates)
      } else {
        newRates[index][monthKey] = value
        setRates(newRates)
        setRateInputs(prev => ({ ...prev, [inputKey]: formatRateForDisplay(value) }))
      }
    }
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    
    rates.forEach((rate, index) => {
      if (!rate.year || rate.year < 1900 || rate.year > 2100) {
        e[`rate_${index}_year`] = 'Ano inválido'
      }
      
      const duplicateYear = rates.find((r, i) => i !== index && r.year === rate.year)
      if (duplicateYear) {
        e[`rate_${index}_year`] = 'Ano duplicado'
      }
    })
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!unit) return

    setSubmitting(true)
    try {
      const updatedUnit = await buildingService.updateMonthlyAdjustmentRates(unit.id, rates)
      onOpenChange(false)
      if (onUpdated) onUpdated(updatedUnit)
      setErrors({})
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao atualizar taxas de ajuste mensal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (unit) {
      if (unit.monthly_adjustment_rates && unit.monthly_adjustment_rates.length > 0) {
        const newRates = unit.monthly_adjustment_rates.map(rate => ({
          id: rate.id,
          year: rate.year,
          january_rate: rate.january_rate,
          february_rate: rate.february_rate,
          march_rate: rate.march_rate,
          april_rate: rate.april_rate,
          may_rate: rate.may_rate,
          june_rate: rate.june_rate,
          july_rate: rate.july_rate,
          august_rate: rate.august_rate,
          september_rate: rate.september_rate,
          october_rate: rate.october_rate,
          november_rate: rate.november_rate,
          december_rate: rate.december_rate
        }))
        setRates(newRates)
        
        const newInputs: RateFormInputs = {}
        newRates.forEach((rate, index) => {
          MONTHS.forEach(month => {
            const monthKey = month.key as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
            newInputs[`${index}_${monthKey}`] = formatRateForDisplay(rate[monthKey])
          })
        })
        setRateInputs(newInputs)
      } else {
        setRates([])
        setRateInputs({})
      }
    }
    setErrors({})
    setFormError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Taxas de Ajuste Mensal</DialogTitle>
          <DialogDescription>
            Edite as taxas de ajuste mensal por ano. Os valores devem ser inseridos em porcentagem (ex: 0,50 para 0,50%).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {rates.map((rate, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                      <Input
                        type="number"
                        value={rate.year || ''}
                        onChange={(e) => updateRate(index, 'year', e.target.value)}
                        className={errors[`rate_${index}_year`] ? 'border-red-500' : ''}
                        disabled={submitting}
                        min="1900"
                        max="2100"
                      />
                      {errors[`rate_${index}_year`] && (
                        <p className="text-sm text-red-600 mt-1">{errors[`rate_${index}_year`]}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeYear(index)}
                    disabled={submitting}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MONTHS.map((month) => {
                    const monthKey = month.key as keyof Pick<RateFormData, 'january_rate' | 'february_rate' | 'march_rate' | 'april_rate' | 'may_rate' | 'june_rate' | 'july_rate' | 'august_rate' | 'september_rate' | 'october_rate' | 'november_rate' | 'december_rate'>
                    const inputKey = `${index}_${monthKey}`
                    return (
                      <div key={month.key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {month.label}
                        </label>
                        <Input
                          type="text"
                          value={rateInputs[inputKey] ?? formatRateForDisplay(rate[monthKey])}
                          onChange={(e) => updateRate(index, monthKey, e.target.value)}
                          disabled={submitting}
                          placeholder="0,00"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {rates.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma taxa cadastrada. Clique em &quot;Adicionar Ano&quot; para começar.
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addYear}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Ano
            </Button>
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

