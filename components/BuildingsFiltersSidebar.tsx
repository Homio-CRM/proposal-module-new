'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BuildingFilters, BuildingListItem } from '@/lib/types/building'
import { Filter, ChevronRight } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

interface BuildingsFiltersSidebarProps {
  filters: BuildingFilters
  onFiltersChange: (filters: BuildingFilters) => void
  onClearFilters: () => void
  buildings: BuildingListItem[]
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'livre', label: 'Com Unidades Livres' },
  { value: 'reservado', label: 'Com Unidades Reservadas' },
  { value: 'vendido', label: 'Com Unidades Vendidas' }
]

export function BuildingsFiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  buildings
}: BuildingsFiltersSidebarProps) {
  const cityOptions = useMemo(() => [
    { value: '', label: 'Selecione a cidade...' },
    ...Array.from(new Set(buildings.map((building: BuildingListItem) => building.city)))
      .sort()
      .map((city: string) => ({ value: city, label: city }))
  ], [buildings])
  const [isExpanded, setIsExpanded] = useState(true)
  const [width, setWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const updateFilters = useCallback((updates: Partial<BuildingFilters>) => {
    const newFilters = { ...filters, ...updates }
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      onFiltersChange(newFilters)
    }
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: keyof BuildingFilters, value: string) => {
    updateFilters({ [key]: value })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 800) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div 
      ref={sidebarRef}
      className={`${isExpanded ? `w-[${width}px]` : 'w-[60px]'} flex-shrink-0 border-r-2 border-gray-300 bg-white transition-all duration-300 ease-in-out sticky top-0 h-screen overflow-hidden`}
      style={{ width: isExpanded ? `${width}px` : '60px' }}
    >
      {isExpanded ? (
        <div className="p-4 h-full overflow-y-auto">
          <div className="space-y-4">
            <BackButton href="/proposals">
              Voltar para Propostas
            </BackButton>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Filtros</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Limpar
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Buscar por nome</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Input
                  placeholder="Nome do empreendimento ou endereço..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Cidade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                >
                  {cityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Status das Unidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('status', option.value)
                        }
                      }}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm text-neutral-700 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-start pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-10 w-10 p-0 mb-4"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center space-y-4">
            <Filter className="h-5 w-5 text-neutral-500" />
            <div className="text-xs text-neutral-500 text-center leading-tight">
              Filtros
            </div>
          </div>
        </div>
      )}
      
      {/* Resize Handle */}
      {isExpanded && (
        <div
          className="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-primary-300 cursor-col-resize transition-colors duration-200"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  )
}
