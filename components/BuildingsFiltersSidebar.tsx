'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BuildingFilters, UnitStatus } from '@/lib/types/building'
import { mockBuildings } from '@/lib/mock/buildings'
import { Search, X, Filter } from 'lucide-react'

interface BuildingsFiltersSidebarProps {
  filters: BuildingFilters
  onFiltersChange: (filters: BuildingFilters) => void
  onClearFilters: () => void
}

export function BuildingsFiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters
}: BuildingsFiltersSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const cities = Array.from(new Set(mockBuildings.map(building => building.city))).sort()

  const handleFilterChange = (key: keyof BuildingFilters, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = filters.search || filters.city || filters.status !== 'all'

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'livre', label: 'Com Unidades Livres' },
    { value: 'reservado', label: 'Com Unidades Reservadas' },
    { value: 'vendido', label: 'Com Unidades Vendidas' }
  ]

  return (
    <div className="w-[320px] flex-shrink-0 border-r-2 border-gray-300 bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-neutral-700">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Nome ou endereço..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-neutral-700">
                Cidade
              </Label>
              <Select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              >
                <option value="">Todas as cidades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-neutral-700">
                Status das Unidades
              </Label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="w-full flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-neutral-600">
                <div className="font-medium mb-2">Resumo dos Filtros:</div>
                <div className="space-y-1 text-xs">
                  {filters.search && (
                    <div>• Busca: "{filters.search}"</div>
                  )}
                  {filters.city && (
                    <div>• Cidade: {filters.city}</div>
                  )}
                  {filters.status !== 'all' && (
                    <div>• Status: {statusOptions.find(opt => opt.value === filters.status)?.label}</div>
                  )}
                  {!hasActiveFilters && (
                    <div className="text-gray-400">Nenhum filtro ativo</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
