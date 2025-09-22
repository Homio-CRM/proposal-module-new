'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ProposalFilters, ProposalStatus } from '@/lib/types/proposal'
import { Filter } from 'lucide-react'

interface ProposalFiltersProps {
  filters: ProposalFilters
  onFiltersChange: (filters: ProposalFilters) => void
  onClearFilters: () => void
  isVisible: boolean
  onToggleVisibility: () => void
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'negada', label: 'Negada' }
]

const developmentOptions = [
  { value: '', label: 'Selecione o empreendimento...' },
  { value: 'residencial_serra', label: 'Residencial Serra' },
  { value: 'jardins_da_serra', label: 'Jardins da Serra' },
  { value: 'torre_azul', label: 'Torre Azul' },
  { value: 'condominio_verde', label: 'Condomínio Verde' }
]

const unitOptions = [
  { value: '', label: 'Selecione a unidade...' },
  { value: '101', label: '101' },
  { value: '102', label: '102' },
  { value: '201', label: '201' },
  { value: '202', label: '202' },
  { value: '301', label: '301' },
  { value: '302', label: '302' }
]

export function ProposalFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible,
  onToggleVisibility
}: ProposalFiltersProps) {
  const handleFilterChange = (key: keyof ProposalFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {isVisible ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
      </div>

      {isVisible && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Filtros</h3>
            <button
              onClick={onClearFilters}
              className="text-sm text-neutral-600 hover:text-neutral-900 font-medium"
            >
              Limpar
            </button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Buscar por nome</h4>
              <Input
                placeholder="Nome da proposta ou contato principal..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Empreendimento</h4>
              <Select
                value={filters.development}
                onChange={(e) => handleFilterChange('development', e.target.value)}
              >
                {developmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Unidade</h4>
              <Select
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h4 className="font-semibold text-neutral-900 mb-4">Status da Proposta</h4>
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={filters.status === option.value}
                      onChange={(e) => handleFilterChange('status', e.target.value as ProposalStatus | 'all')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
