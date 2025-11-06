'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ProposalFilters, ProposalStatus } from '@/lib/types/proposal'
import { Filter, ChevronRight } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

interface SelectOption { value: string; label: string }

interface ProposalFiltersSidebarProps {
  filters: ProposalFilters
  onFiltersChange: (filters: ProposalFilters) => void
  onClearFilters: () => void
  developmentOptions?: SelectOption[]
  unitOptions?: SelectOption[]
  profiles?: Array<{ id: string; name: string | null }>
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'negada', label: 'Negada' }
]

const defaultDevelopmentOptions: SelectOption[] = [
  { value: '', label: 'Selecione o empreendimento...' }
]

const defaultUnitOptions: SelectOption[] = [
  { value: '', label: 'Selecione a unidade...' }
]

export function ProposalFiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  developmentOptions = defaultDevelopmentOptions,
  unitOptions = defaultUnitOptions,
  profiles = []
}: ProposalFiltersSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [width, setWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const updateFilters = useCallback((updates: Partial<ProposalFilters>) => {
    const newFilters = { ...filters, ...updates }
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      onFiltersChange(newFilters)
    }
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: keyof ProposalFilters, value: string) => {
    updateFilters({ [key]: value })
  }

  const handleCreatedByChange = (profileId: string, checked: boolean) => {
    if (profileId === 'all') {
      if (checked) {
        updateFilters({ createdBy: 'all' })
      }
    } else {
      const currentCreatedBy = filters.createdBy === 'all' ? [] : (Array.isArray(filters.createdBy) ? filters.createdBy : [])
      
      let newCreatedBy: string[] | 'all'
      if (checked) {
        newCreatedBy = [...currentCreatedBy, profileId]
      } else {
        newCreatedBy = currentCreatedBy.filter(id => id !== profileId)
        if (newCreatedBy.length === 0) {
          newCreatedBy = 'all'
        }
      }
      
      updateFilters({ createdBy: newCreatedBy })
    }
  }

  const isCreatedByChecked = (profileId: string): boolean => {
    if (profileId === 'all') {
      return filters.createdBy === 'all'
    }
    return Array.isArray(filters.createdBy) && filters.createdBy.includes(profileId)
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
            <BackButton href="/buildings">
              Ver Empreendimentos
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
                  placeholder="Nome da proposta ou contato principal..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Empreendimento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Unidade</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Status da Proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('status', option.value as ProposalStatus | 'all')
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-neutral-900">Criado Por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="created-by-all"
                    checked={isCreatedByChecked('all')}
                    onCheckedChange={(checked) => handleCreatedByChange('all', checked as boolean)}
                  />
                  <Label htmlFor="created-by-all" className="text-sm text-neutral-700 cursor-pointer">
                    Todos
                  </Label>
                </div>
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`created-by-${profile.id}`}
                      checked={isCreatedByChecked(profile.id)}
                      onCheckedChange={(checked) => handleCreatedByChange(profile.id, checked as boolean)}
                    />
                    <Label htmlFor={`created-by-${profile.id}`} className="text-sm text-neutral-700 cursor-pointer">
                      {profile.name || 'Sem nome'}
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
