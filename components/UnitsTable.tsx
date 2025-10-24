'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Unit } from '@/lib/types/building'
import { Trash2, Home, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UnitWithBuilding extends Unit {
  buildingName: string
  buildingAddress: string
  buildingCity: string
  buildingState: string
}

interface UnitsTableProps {
  units: UnitWithBuilding[]
  onDelete: (id: string) => void
  selectedUnits: string[]
  onSelectUnit: (id: string, selected: boolean) => void
  onSelectAll: () => void
}

export function UnitsTable({ 
  units, 
  onDelete, 
  selectedUnits, 
  onSelectUnit, 
  onSelectAll
}: UnitsTableProps) {
  const router = useRouter()
  


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'livre':
        return 'success'
      case 'reservado':
        return 'warning'
      case 'vendido':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre':
        return 'Livre'
      case 'reservado':
        return 'Reservado'
      case 'vendido':
        return 'Vendido'
      default:
        return 'Outro'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <Checkbox
                  checked={units.length > 0 && units.every(unit => selectedUnits.includes(unit.id))}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Unidade
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Empreendimento
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Status
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {units.map((unit, index) => (
              <tr 
                key={unit.id} 
                className={`group cursor-pointer transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100`}
                onClick={() => {
                  router.push(`/buildings/${unit.building_id}/${unit.id}`)
                }}
              >
                <td className="px-2 py-3 whitespace-nowrap w-10">
                  <Checkbox
                    checked={selectedUnits.includes(unit.id)}
                    onCheckedChange={(checked) => {
                      onSelectUnit(unit.id, checked as boolean)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar ${unit.number}`}
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Home className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors duration-150">
                        Unidade {unit.number}
                      </div>
                      <div className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors duration-150">
                        {unit.floor ? `${unit.floor}° andar` : ''}{unit.floor && unit.tower ? ' • ' : ''}{unit.tower ? `Torre ${unit.tower}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-neutral-900">
                        {unit.buildingName}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {unit.buildingCity}, {unit.buildingState}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[100px]">
                  <Badge variant={getStatusBadgeVariant(unit.status)}>
                    {getStatusLabel(unit.status)}
                  </Badge>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-center w-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(unit.id)
                    }}
                    className="h-7 w-7 p-0 border-transparent hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
