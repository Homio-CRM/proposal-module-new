'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Unit, MonthlyAdjustmentRate } from '@/lib/types/building'
import { TrendingUp } from 'lucide-react'

interface MonthlyAdjustmentRatesTableProps {
  units: Unit[]
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

export function MonthlyAdjustmentRatesTable({ units }: MonthlyAdjustmentRatesTableProps) {
  const sortedUnits = [...units].sort((a, b) => {
    const towerCompare = (a.tower || '').localeCompare(b.tower || '', 'pt-BR', { sensitivity: 'base' })
    if (towerCompare !== 0) return towerCompare
    return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
  })

  const getAllYears = (): number[] => {
    const years = new Set<number>()
    sortedUnits.forEach(unit => {
      if (unit.monthly_adjustment_rates) {
        unit.monthly_adjustment_rates.forEach(rate => {
          years.add(rate.year)
        })
      }
    })
    return Array.from(years).sort((a, b) => a - b)
  }

  const years = getAllYears()

  const getRateForYear = (unit: Unit, year: number): MonthlyAdjustmentRate | null => {
    if (!unit.monthly_adjustment_rates) return null
    return unit.monthly_adjustment_rates.find(rate => rate.year === year) || null
  }

  const roundTo8Decimals = (value: number): number => {
    return Math.round(value * 100000000) / 100000000
  }

  const calculateTotalAccumulated = (rates: MonthlyAdjustmentRate[]): number => {
    const allMonths: number[] = []
    
    const sortedRates = [...rates].sort((a, b) => a.year - b.year)
    
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
        <CardContent className="py-12">
          <p className="text-center text-gray-500">Nenhuma taxa de ajuste mensal cadastrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          Taxas de Ajuste Mensais por Unidade
        </CardTitle>
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
                  <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {unit.name || unit.number}
                  </td>
                  {(() => {
                    const allRates = unit.monthly_adjustment_rates || []
                    const lastYearIndex = years.length - 1
                    return years.map((year, yearIndex) => {
                      const rate = getRateForYear(unit, year)
                      const isLastYear = yearIndex === lastYearIndex
                      if (!rate) {
                        return (
                          <React.Fragment key={year}>
                            {MONTHS.map(() => (
                              <td key={`${year}_empty`} className="text-center py-3 px-1 text-sm text-gray-400">-</td>
                            ))}
                            <td className="text-center py-3 px-2 text-sm text-gray-400 border-l border-gray-200">
                              {isLastYear && allRates.length > 0 ? formatTotalRate(calculateTotalAccumulated(allRates)) : '-'}
                            </td>
                          </React.Fragment>
                        )
                      }
                      return (
                        <React.Fragment key={year}>
                          {MONTHS.map(month => {
                            const monthKey = month.key as keyof MonthlyAdjustmentRate
                            const monthRate = rate[monthKey] as number
                            return (
                              <td key={`${year}_${month.key}`} className="text-center py-3 px-1 text-sm text-gray-700">
                                {formatRate(monthRate)}
                              </td>
                            )
                          })}
                          <td className="text-center py-3 px-2 font-semibold text-sm text-gray-900 border-l border-gray-200">
                            {isLastYear ? formatTotalRate(calculateTotalAccumulated(allRates)) : '-'}
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

