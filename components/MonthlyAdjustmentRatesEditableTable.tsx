'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Unit } from '@/lib/types/building'
import { TrendingUp, Plus, Save } from 'lucide-react'
import { buildingService } from '@/lib/services/buildingService'

interface MonthlyAdjustmentRatesEditableTableProps {
  units: Unit[]
  buildingId: string
  onSave?: () => void
}

const MONTHS = [
  { key: 'january_rate', label: 'Jan' },
  { key: 'february_rate', label: 'Fev' },
  { key: 'march_rate', label: 'Mar' },
  { key: 'april_rate', label: 'Abr' },
  { key: 'may_rate', label: 'Mai' },
  { key: 'june_rate', label: 'Jun' },
  { key: 'july_rate', label: 'Jul' },
  { key: 'august_rate', label: 'Ago' },
  { key: 'september_rate', label: 'Set' },
  { key: 'october_rate', label: 'Out' },
  { key: 'november_rate', label: 'Nov' },
  { key: 'december_rate', label: 'Dez' }
] as const

type MonthKey = typeof MONTHS[number]['key']

interface EditableRate {
  id?: string
  unit_id: string
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


export function MonthlyAdjustmentRatesEditableTable({ 
  units, 
  buildingId,
  onSave 
}: MonthlyAdjustmentRatesEditableTableProps) {
  const router = useRouter()
  const [editableRates, setEditableRates] = useState<Map<string, EditableRate>>(new Map())
  const [originalRates, setOriginalRates] = useState<Map<string, EditableRate>>(new Map())
  const [cellValues, setCellValues] = useState<Map<string, string>>(new Map())
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingCellOriginalValue, setEditingCellOriginalValue] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      const towerCompare = (a.tower || '').localeCompare(b.tower || '', 'pt-BR', { sensitivity: 'base' })
      if (towerCompare !== 0) return towerCompare
      return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
    })
  }, [units])

  const getAllYears = (): number[] => {
    const years = new Set<number>()
    editableRates.forEach(rate => {
      years.add(rate.year)
    })
    return Array.from(years).sort((a, b) => a - b)
  }

  const years = getAllYears()

  useEffect(() => {
    const ratesMap = new Map<string, EditableRate>()
    const originalRatesMap = new Map<string, EditableRate>()
    const valuesMap = new Map<string, string>()

    sortedUnits.forEach(unit => {
      if (unit.monthly_adjustment_rates) {
        unit.monthly_adjustment_rates.forEach(rate => {
          const key = `${unit.id}_${rate.year}`
          const rateData = {
            id: rate.id,
            unit_id: unit.id,
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
          }
          ratesMap.set(key, rateData)
          originalRatesMap.set(key, { ...rateData })

          MONTHS.forEach(month => {
            const cellKey = `${unit.id}_${rate.year}_${month.key}`
            const value = rate[month.key] as number
            valuesMap.set(cellKey, formatPercentageForDisplay(value))
          })
        })
      }
    })

    setEditableRates(ratesMap)
    setOriginalRates(originalRatesMap)
    setCellValues(valuesMap)
    setHasChanges(false)
  }, [sortedUnits])

  const formatPercentageForDisplay = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return ''
    return (value * 100).toFixed(2).replace('.', ',')
  }

  const parsePercentageFromInput = (value: string): number => {
    if (!value || value.trim() === '') return 0
    const normalized = value.replace(',', '.')
    const parsed = parseFloat(normalized)
    if (isNaN(parsed)) return 0
    return parsed / 100
  }

  const formatInputValue = (value: string): string => {
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

  const getCellKey = (unitId: string, year: number, month: MonthKey): string => {
    return `${unitId}_${year}_${month}`
  }

  const getRateKey = (unitId: string, year: number): string => {
    return `${unitId}_${year}`
  }

  const getRate = (unitId: string, year: number): EditableRate | null => {
    const key = getRateKey(unitId, year)
    return editableRates.get(key) || null
  }

  const updateCellValue = (unitId: string, year: number, month: MonthKey, value: string) => {
    const cellKey = getCellKey(unitId, year, month)
    const formatted = formatInputValue(value)
    setCellValues(prev => {
      const newMap = new Map(prev)
      newMap.set(cellKey, formatted)
      return newMap
    })

    const rateKey = getRateKey(unitId, year)
    const rate = editableRates.get(rateKey)
    
    if (rate) {
      const newRate = { ...rate }
      newRate[month] = parsePercentageFromInput(formatted)
      setEditableRates(prev => {
        const newMap = new Map(prev)
        newMap.set(rateKey, newRate)
        return newMap
      })
    } else {
      const newRate: EditableRate = {
        unit_id: unitId,
        year: year,
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
      newRate[month] = parsePercentageFromInput(formatted)
      setEditableRates(prev => {
        const newMap = new Map(prev)
        newMap.set(rateKey, newRate)
        return newMap
      })

      MONTHS.forEach(m => {
        if (m.key !== month) {
          const cellKey = getCellKey(unitId, year, m.key)
          setCellValues(prev => {
            const newMap = new Map(prev)
            if (!newMap.has(cellKey)) {
              newMap.set(cellKey, '')
            }
            return newMap
          })
        }
      })
    }

    setHasChanges(true)
  }

  const addYear = () => {
    const currentYear = new Date().getFullYear()
    let newYear = currentYear
    while (years.includes(newYear)) {
      newYear++
    }

    sortedUnits.forEach(unit => {
      const rateKey = getRateKey(unit.id, newYear)
      if (!editableRates.has(rateKey)) {
        const newRate: EditableRate = {
          unit_id: unit.id,
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
        setEditableRates(prev => {
          const newMap = new Map(prev)
          newMap.set(rateKey, newRate)
          return newMap
        })

        MONTHS.forEach(month => {
          const cellKey = getCellKey(unit.id, newYear, month.key)
          setCellValues(prev => {
            const newMap = new Map(prev)
            newMap.set(cellKey, '')
            return newMap
          })
        })
      }
    })

    setHasChanges(true)
  }

  const roundTo8Decimals = (value: number): number => {
    return Math.round(value * 100000000) / 100000000
  }

  const calculateTotalAccumulated = (unitId: string): number => {
    const allMonths: number[] = []
    
    const unitRates: EditableRate[] = []
    editableRates.forEach(rate => {
      if (rate.unit_id === unitId) {
        unitRates.push(rate)
      }
    })
    
    const sortedRates = unitRates.sort((a, b) => a.year - b.year)
    
    sortedRates.forEach(rate => {
      allMonths.push(
        roundTo8Decimals(rate.january_rate || 0),
        roundTo8Decimals(rate.february_rate || 0),
        roundTo8Decimals(rate.march_rate || 0),
        roundTo8Decimals(rate.april_rate || 0),
        roundTo8Decimals(rate.may_rate || 0),
        roundTo8Decimals(rate.june_rate || 0),
        roundTo8Decimals(rate.july_rate || 0),
        roundTo8Decimals(rate.august_rate || 0),
        roundTo8Decimals(rate.september_rate || 0),
        roundTo8Decimals(rate.october_rate || 0),
        roundTo8Decimals(rate.november_rate || 0),
        roundTo8Decimals(rate.december_rate || 0)
      )
    })
    
    let product = 1
    allMonths.forEach(monthRate => {
      product = roundTo8Decimals(product * roundTo8Decimals(1 + monthRate))
    })
    return roundTo8Decimals(product - 1)
  }

  const formatRate = (rate: number | null | undefined): string => {
    if (rate === null || rate === undefined || isNaN(rate) || rate === 0) return '-'
    return `${(rate * 100).toFixed(2)}%`
  }

  const truncateTo2Decimals = (value: number): string => {
    const multiplied = value * 100
    const truncated = Math.floor(multiplied * 100) / 100
    return truncated.toFixed(2)
  }

  const formatTotalRate = (rate: number | null | undefined): string => {
    if (rate === null || rate === undefined || isNaN(rate) || rate === 0) return '-'
    return `${truncateTo2Decimals(rate)}%`
  }

  const ratesAreEqual = (rate1: EditableRate, rate2: EditableRate): boolean => {
    const tolerance = 0.000001
    return (
      Math.abs(rate1.january_rate - rate2.january_rate) < tolerance &&
      Math.abs(rate1.february_rate - rate2.february_rate) < tolerance &&
      Math.abs(rate1.march_rate - rate2.march_rate) < tolerance &&
      Math.abs(rate1.april_rate - rate2.april_rate) < tolerance &&
      Math.abs(rate1.may_rate - rate2.may_rate) < tolerance &&
      Math.abs(rate1.june_rate - rate2.june_rate) < tolerance &&
      Math.abs(rate1.july_rate - rate2.july_rate) < tolerance &&
      Math.abs(rate1.august_rate - rate2.august_rate) < tolerance &&
      Math.abs(rate1.september_rate - rate2.september_rate) < tolerance &&
      Math.abs(rate1.october_rate - rate2.october_rate) < tolerance &&
      Math.abs(rate1.november_rate - rate2.november_rate) < tolerance &&
      Math.abs(rate1.december_rate - rate2.december_rate) < tolerance
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const ratesByUnit = new Map<string, EditableRate[]>()
      
      editableRates.forEach(editedRate => {
        const originalKey = getRateKey(editedRate.unit_id, editedRate.year)
        const originalRate = originalRates.get(originalKey)
        
        if (!originalRate) {
          const hasNonZeroValue = MONTHS.some(month => {
            const value = editedRate[month.key]
            return value !== null && value !== undefined && !isNaN(value) && Math.abs(value) > 0.000001
          })
          
          if (hasNonZeroValue) {
            if (!ratesByUnit.has(editedRate.unit_id)) {
              ratesByUnit.set(editedRate.unit_id, [])
            }
            ratesByUnit.get(editedRate.unit_id)!.push(editedRate)
          }
        } else if (!ratesAreEqual(editedRate, originalRate)) {
          if (!ratesByUnit.has(editedRate.unit_id)) {
            ratesByUnit.set(editedRate.unit_id, [])
          }
          ratesByUnit.get(editedRate.unit_id)!.push(editedRate)
        }
      })

      for (const [unitId, rates] of ratesByUnit) {
        const updatedUnit = await buildingService.updateMonthlyAdjustmentRates(unitId, rates)
        
        if (updatedUnit.monthly_adjustment_rates) {
          updatedUnit.monthly_adjustment_rates.forEach(savedRate => {
            const rateKey = getRateKey(unitId, savedRate.year)
            const rateData: EditableRate = {
              id: savedRate.id,
              unit_id: savedRate.unit_id,
              year: savedRate.year,
              january_rate: savedRate.january_rate,
              february_rate: savedRate.february_rate,
              march_rate: savedRate.march_rate,
              april_rate: savedRate.april_rate,
              may_rate: savedRate.may_rate,
              june_rate: savedRate.june_rate,
              july_rate: savedRate.july_rate,
              august_rate: savedRate.august_rate,
              september_rate: savedRate.september_rate,
              october_rate: savedRate.october_rate,
              november_rate: savedRate.november_rate,
              december_rate: savedRate.december_rate
            }
            setOriginalRates(prev => {
              const newMap = new Map(prev)
              newMap.set(rateKey, rateData)
              return newMap
            })
            setEditableRates(prev => {
              const newMap = new Map(prev)
              newMap.set(rateKey, rateData)
              return newMap
            })
          })
        }
      }

      setHasChanges(false)
      if (onSave) {
        onSave()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar taxas')
    } finally {
      setSaving(false)
    }
  }

  if (sortedUnits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">Nenhuma unidade encontrada</p>
        </CardContent>
      </Card>
    )
  }

  if (years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Taxas de Ajuste Mensais por Unidade
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addYear}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Ano
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">Nenhuma taxa cadastrada. Clique em &quot;Adicionar Ano&quot; para começar.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Taxas de Ajuste Mensais por Unidade
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addYear}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Ano
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 sticky left-0 bg-white z-10">
                  Unidade
                </th>
                {years.map(year => (
                  <th key={year} colSpan={13} className="text-center py-3 px-2 font-semibold text-sm text-gray-700 border-l border-gray-200">
                    {year}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-4 font-medium text-xs text-gray-600 sticky left-0 bg-gray-50 z-10"></th>
                {years.map(year => (
                  <React.Fragment key={year}>
                    {MONTHS.map(month => (
                      <th key={`${year}_${month.key}`} className="text-center py-2 px-1 font-medium text-xs text-gray-600">
                        {month.label}
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-medium text-xs text-gray-600 border-l border-gray-200">
                      Total
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedUnits.map((unit) => (
                <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td 
                    className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white z-10 cursor-pointer hover:text-primary-600 hover:underline"
                    onClick={() => router.push(`/buildings/${buildingId}/${unit.id}`)}
                    title="Clique para ver detalhes da unidade"
                  >
                    {unit.name || unit.number}
                  </td>
                  {(() => {
                    const lastYearIndex = years.length - 1
                    return years.map((year, yearIndex) => {
                      const rate = getRate(unit.id, year)
                      const isLastYear = yearIndex === lastYearIndex
                      return (
                        <React.Fragment key={year}>
                          {MONTHS.map(month => {
                            const cellKey = getCellKey(unit.id, year, month.key)
                            const cellValue = cellValues.get(cellKey) || ''
                            const isEditing = editingCell === cellKey
                            
                            return (
                              <td key={`${year}_${month.key}`} className="text-center py-1 px-1">
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => updateCellValue(unit.id, year, month.key, e.target.value)}
                                    onBlur={() => {
                                      setEditingCell(null)
                                      setEditingCellOriginalValue(null)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur()
                                      } else if (e.key === 'Escape') {
                                        if (editingCellOriginalValue !== null) {
                                          const originalValue = editingCellOriginalValue
                                          setCellValues(prev => {
                                            const newMap = new Map(prev)
                                            newMap.set(cellKey, originalValue)
                                            return newMap
                                          })
                                          
                                          const rateKey = getRateKey(unit.id, year)
                                          const originalRate = unit.monthly_adjustment_rates?.find(r => r.year === year)
                                          if (originalRate) {
                                            const rate = editableRates.get(rateKey)
                                            if (rate) {
                                              const restoredRate = { ...rate }
                                              restoredRate[month.key] = originalRate[month.key] as number
                                              setEditableRates(prev => {
                                                const newMap = new Map(prev)
                                                newMap.set(rateKey, restoredRate)
                                                return newMap
                                              })
                                            }
                                          } else {
                                            setEditableRates(prev => {
                                              const newMap = new Map(prev)
                                              newMap.delete(rateKey)
                                              return newMap
                                            })
                                          }
                                        }
                                        setEditingCell(null)
                                        setEditingCellOriginalValue(null)
                                      }
                                    }}
                                    className="h-8 w-16 text-center text-sm px-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingCell(cellKey)
                                      setEditingCellOriginalValue(cellValue)
                                    }}
                                    className="h-8 w-16 mx-auto flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded border border-transparent hover:border-gray-300"
                                    title="Clique para editar"
                                  >
                                    {cellValue || '-'}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="text-center py-3 px-2 font-semibold text-sm text-gray-900 border-l border-gray-200">
                            {isLastYear ? formatTotalRate(calculateTotalAccumulated(unit.id)) : '-'}
                          </td>
                        </React.Fragment>
                      )
                    })
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

