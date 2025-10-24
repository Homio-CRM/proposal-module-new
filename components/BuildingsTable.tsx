'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BuildingListItem } from '@/lib/types/building'
import { Building2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BuildingsTableProps {
  buildings: BuildingListItem[]
  selectedBuildings: string[]
  onSelectBuilding: (id: string, selected: boolean) => void
  onSelectAll: () => void
}

export function BuildingsTable({ 
  buildings, 
  selectedBuildings, 
  onSelectBuilding, 
  onSelectAll
}: BuildingsTableProps) {
  const router = useRouter()

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <Checkbox
                  checked={buildings.length > 0 && buildings.every(building => selectedBuildings.includes(building.id))}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Empreendimento
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Localização
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Total
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Livres
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Reservadas
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Vendidas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {buildings.map((building, index) => (
              <tr 
                key={building.id} 
                className={`group cursor-pointer transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100`}
                onClick={() => router.push(`/buildings/${building.id}`)}
              >
                <td className="px-2 py-3 whitespace-nowrap w-10">
                  <Checkbox
                    checked={selectedBuildings.includes(building.id)}
                    onCheckedChange={(checked) => {
                      onSelectBuilding(building.id, checked as boolean)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar ${building.name}`}
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[200px]">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors duration-150">
                        {building.name}
                      </div>

                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-neutral-900">
                        {building.city}, {building.state}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {building.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-900 min-w-[100px]">
                  <div className="text-center">
                    <span className="font-medium">{building.totalUnits}</span>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[100px]">
                  <div className="text-center">
                    <Badge variant={building.availableUnits > 0 ? 'success' : 'outline'}>
                      {building.availableUnits}
                    </Badge>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[100px]">
                  <div className="text-center">
                    <Badge variant={building.reservedUnits > 0 ? 'warning' : 'outline'}>
                      {building.reservedUnits}
                    </Badge>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[100px]">
                  <div className="text-center">
                    <Badge variant={building.soldUnits > 0 ? 'secondary' : 'outline'}>
                      {building.soldUnits}
                    </Badge>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
