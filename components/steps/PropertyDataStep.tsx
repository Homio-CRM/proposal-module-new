'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { parseISODateToLocal } from '@/lib/utils/date'
import type { PropertyData } from '@/lib/types/proposal'
import { getSupabase } from '@/lib/supabaseClient'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface PropertyDataStepProps {
  data: PropertyData
  onDataChange: (data: PropertyData) => void
  errors?: Record<string, string>
}

interface Building {
  id: string
  name: string
}

interface Unit {
  id: string
  name: string
  number: string
  tower: string
  floor: string
  buildingId: string
  buildingName: string
  label: string
  status: string
  currentValue?: number
  parkingSpaceCount?: number
  bedroomCount?: number
  totalArea?: number
}

type UnitRow = {
  id: string
  name: string | null
  number: string
  tower: string | null
  floor: string | null
  building_id: string
  status: string
  gross_price_amount?: number | null
  price_correction_rate?: number | null
  parking_space_count?: number | null
  bedroom_count?: number | null
  total_area?: number | null
  buildings?: { name?: string | null } | null
}

export default function PropertyDataStep({ 
  data, 
  onDataChange,
  errors = {}
}: PropertyDataStepProps) {
  const { userData } = useUserDataContext()
  const [formData, setFormData] = useState<PropertyData>(data)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allUnits, setAllUnits] = useState<Unit[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [selectedUnitStatus, setSelectedUnitStatus] = useState<string>('')

  useEffect(() => {
    setFormData(prev => {
      if (prev.unitId && prev.unitId === data.unitId && prev.parkingSpots !== undefined && data.parkingSpots === undefined) {
        return { ...data, parkingSpots: prev.parkingSpots }
      }
      return data
    })
  }, [data])

  // Atualizar status da unidade e building selecionado quando formData.unitId muda
  useEffect(() => {
    if (formData.unitId && allUnits.length > 0) {
      const unitFromDb = allUnits.find(u => u.id === formData.unitId)
      if (unitFromDb) {
        setSelectedUnitStatus(unitFromDb.status || '')
        setSelectedBuildingId(unitFromDb.buildingId)
        
        // Garantir que parkingSpots seja atualizado quando a unidade é carregada
        if (unitFromDb.parkingSpaceCount !== undefined && unitFromDb.parkingSpaceCount !== null) {
          if (formData.parkingSpots !== unitFromDb.parkingSpaceCount) {
            const updated: PropertyData = {
              ...formData,
              parkingSpots: unitFromDb.parkingSpaceCount
            }
            setFormData(updated)
            onDataChange(updated)
          }
        }
      } else {
      }
    }
  }, [formData.unitId, allUnits])


  useEffect(() => {
    const loadData = async () => {
      if (!userData?.activeLocation) return
      
      try {
        const supabase = await getSupabase()
        
        const { data: buildingsData } = await supabase
          .from('buildings')
          .select('id, name')
          .eq('agency_id', userData.activeLocation)
          .order('name', { ascending: true })
        
        const { data: unitsData } = await supabase
          .from('units')
          .select('id, name, number, tower, floor, building_id, status, gross_price_amount, price_correction_rate, parking_space_count, bedroom_count, total_area, buildings(name)')
          .eq('agency_id', userData.activeLocation)
          .order('number', { ascending: true })
        
        if (buildingsData) {
          setBuildings(buildingsData.map(b => ({ id: b.id as string, name: b.name as string })))
        }
        
        if (unitsData) {
          const rows = unitsData as unknown as UnitRow[]
          const mapped: Unit[] = rows
            .map(u => {
              const buildingName = u.buildings?.name ?? ''
              const grossPrice = u.gross_price_amount ?? 0
              const correctionRate = u.price_correction_rate ?? 0
              const currentValue = grossPrice * (1 + correctionRate)
              return {
                id: u.id,
                name: u.name ?? '',
                number: u.number,
                tower: u.tower ?? '',
                floor: u.floor ?? '',
                buildingId: u.building_id,
                buildingName,
                label: u.name ?? u.number,
                status: u.status,
                currentValue: currentValue > 0 ? currentValue : undefined,
                parkingSpaceCount: u.parking_space_count !== null && u.parking_space_count !== undefined ? u.parking_space_count : undefined,
                bedroomCount: u.bedroom_count !== null && u.bedroom_count !== undefined ? u.bedroom_count : undefined,
                totalArea: u.total_area !== null && u.total_area !== undefined ? u.total_area : undefined
              }
            })
          setAllUnits(mapped)
          
          // Definir building selecionado baseado no formData
          
          if (formData.buildingId) {
            setSelectedBuildingId(formData.buildingId)
          } else if (formData.unitId) {
            const currentUnit = mapped.find(unit => unit.id === formData.unitId)
            if (currentUnit) {
              setSelectedBuildingId(currentUnit.buildingId)
            } else {
            }
          }
        }
      } catch {
      }
    }
    loadData()
  }, [userData?.activeLocation, formData.buildingId, formData.development, formData.unitId])

  // Para o select, mostrar unidades disponíveis + a unidade selecionada (mesmo que não esteja disponível)
  const availableUnits = selectedBuildingId 
    ? allUnits.filter(u => u.buildingId === selectedBuildingId && u.status === 'available')
    : allUnits.filter(u => u.status === 'available')
  
  // Se há uma unidade selecionada que não está disponível, incluí-la na lista
  const filteredUnits = (() => {
    let units = availableUnits
    
    if (formData.unitId) {
      const selectedUnit = allUnits.find(u => u.id === formData.unitId)
      if (selectedUnit && selectedUnit.status !== 'available') {
        units = [selectedUnit, ...availableUnits.filter(u => u.id !== formData.unitId)]
      }
    }
    
    const unitsWithTower = units.filter(u => u.tower && u.tower.trim() !== '')
    const unitsWithoutTower = units.filter(u => !u.tower || u.tower.trim() === '')
    
    const sortedWithTower = unitsWithTower.sort((a, b) => {
      const towerCompare = (a.tower || '').localeCompare(b.tower || '', 'pt-BR')
      if (towerCompare !== 0) return towerCompare
      return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
    })
    
    const sortedWithoutTower = unitsWithoutTower.sort((a, b) => {
      return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
    })
    
    return [...sortedWithTower, ...sortedWithoutTower]
  })()
  
  // Para verificar status, usar todas as unidades
  const allUnitsForStatus = selectedBuildingId 
    ? allUnits.filter(u => u.buildingId === selectedBuildingId)
    : allUnits

  const handleBuildingChange = (buildingId: string) => {
    
    setSelectedBuildingId(buildingId)
    const building = buildings.find(b => b.id === buildingId)
    
    const next: PropertyData = {
      ...formData,
      development: building?.name || '',
      buildingId: buildingId,
      unitId: undefined,
      unit: '',
      tower: '',
      floor: ''
    }
    
    setFormData(next)
    onDataChange(next)
  }

  const handleUnitChange = (unitId: string) => {
    const selected = allUnits.find(u => u.id === unitId)
    
    if (selected) {
      setSelectedBuildingId(selected.buildingId)
      
      // Capturar o status da unidade selecionada
      const unitFromDb = allUnitsForStatus.find(u => u.id === unitId)
      setSelectedUnitStatus(unitFromDb?.status || '')
      
      const next: PropertyData = {
        ...formData,
        unitId: selected.id,
        unit: selected.name || selected.number,
        tower: selected.tower || '',
        floor: selected.floor || '',
        development: selected.buildingName,
        buildingId: selected.buildingId,
        unitValue: selected.currentValue,
        parkingSpots: selected.parkingSpaceCount !== null && selected.parkingSpaceCount !== undefined ? selected.parkingSpaceCount : undefined
      }
      
      setFormData(next)
      onDataChange(next)
    }
  }

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    onDataChange(next)
  }


  

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label htmlFor="buildingId" className="block text-sm font-medium text-neutral-700 mb-2">
            Empreendimento *
          </label>
          <Select 
            value={formData.buildingId || selectedBuildingId} 
            onChange={(e) => {
              handleBuildingChange(e.target.value)
            }}
            className={cn("w-full", errors['property.development'] && 'border-red-500')}
          >
            <option value="">Selecione o empreendimento</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          {errors['property.development'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.development']}</p>
          )}
        </div>

        <div>
          <label htmlFor="unitId" className="block text-sm font-medium text-neutral-700 mb-2">
            Unidade *
          </label>
          <Select 
            value={formData.unitId || ''} 
            onChange={(e) => {
              handleUnitChange(e.target.value)
            }}
            className={cn("w-full", errors['property.unit'] && 'border-red-500')}
          >
            <option value="">Selecione a unidade</option>
            {filteredUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          {errors['property.unit'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.unit']}</p>
          )}
          {formData.unitId && selectedUnitStatus && selectedUnitStatus !== 'available' && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {selectedUnitStatus === 'sold' && 'Esta unidade já foi vendida.'}
                {selectedUnitStatus === 'reserved' && 'Esta unidade está reservada.'}
                {selectedUnitStatus !== 'sold' && selectedUnitStatus !== 'reserved' && `Esta unidade está com status: ${selectedUnitStatus}.`}
              </p>
            </div>
          )}
        </div>


        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="shouldReserveUnit"
              checked={formData.shouldReserveUnit !== false}
              onCheckedChange={(checked) => {
                const next = { 
                  ...formData, 
                  shouldReserveUnit: checked === true,
                  reservedUntil: checked === false ? '' : formData.reservedUntil
                }
                setFormData(next)
                onDataChange(next)
              }}
            />
            <label htmlFor="shouldReserveUnit" className="text-sm font-medium text-neutral-700 cursor-pointer">
              Reservar Imóvel
            </label>
          </div>
        </div>

        {formData.shouldReserveUnit !== false && (
          <div>
            <label htmlFor="reservedUntil" className="block text-sm font-medium text-neutral-700 mb-2">
              Reservado Até
            </label>
            <CustomDatePicker
              value={parseISODateToLocal(formData.reservedUntil)}
              onChange={(date) => handleInputChange('reservedUntil', date ? date.toISOString().split('T')[0] : '')}
              placeholder="Selecione a data de reserva"
              minDate={new Date()}
              error={!!errors['property.reservedUntil']}
            />
            {errors['property.reservedUntil'] && (
              <p className="text-sm text-red-600 mt-1">{errors['property.reservedUntil']}</p>
            )}
          </div>
        )}
      </div>

      {formData.unitId && (() => {
        const selectedUnit = allUnits.find(u => u.id === formData.unitId)
        if (!selectedUnit) return null
        
        return (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Informações da Unidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {selectedUnit.tower && selectedUnit.tower.trim() !== '' && (
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Torre</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedUnit.tower}</p>
                </div>
              )}
              {selectedUnit.floor && selectedUnit.floor.trim() !== '' && (
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Pavimento</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedUnit.floor}</p>
                </div>
              )}
              {selectedUnit.parkingSpaceCount !== undefined && (
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Quantidade de Vagas</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedUnit.parkingSpaceCount}</p>
                </div>
              )}
              {selectedUnit.bedroomCount !== undefined && (
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Quantidade de Quartos</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedUnit.bedroomCount}</p>
                </div>
              )}
              {selectedUnit.totalArea !== undefined && (
                <div>
                  <p className="text-xs text-neutral-600 mb-1">Área Total</p>
                  <p className="text-sm font-medium text-neutral-900">{selectedUnit.totalArea.toLocaleString('pt-BR')} m²</p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            placeholder="Digite observações adicionais sobre o imóvel..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  )
}