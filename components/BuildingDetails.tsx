'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuildingWithUnits, Unit } from '@/lib/types/building'
import { 
  Building2, 
  MapPin, 
  Home,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BuildingDetailsProps {
  building: BuildingWithUnits
}

export function BuildingDetails({ building }: BuildingDetailsProps) {
  const router = useRouter()


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

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

  const handleUnitClick = (unitId: string) => {
    router.push(`/units/${unitId}`)
  }

  return (
    <div className="space-y-6">
      {/* Informações do Empreendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Informações do Empreendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="text-sm text-gray-900">{building.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID</label>
              <p className="text-sm text-gray-900">{building.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CEP</label>
              <p className="text-sm text-gray-900">{building.zipCode}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Endereço</label>
              <p className="text-sm text-gray-900">{building.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cidade</label>
              <p className="text-sm text-gray-900">{building.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <p className="text-sm text-gray-900">{building.state}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo das Unidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary-600" />
            Resumo das Unidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{building.totalUnits}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{building.availableUnits}</div>
              <div className="text-sm text-green-600">Livres</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{building.reservedUnits}</div>
              <div className="text-sm text-yellow-600">Reservadas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{building.soldUnits}</div>
              <div className="text-sm text-blue-600">Vendidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Unidades ({building.units.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {building.units.map((unit) => (
              <div 
                key={unit.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleUnitClick(unit.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Home className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Unidade {unit.number}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(unit.status)}>
                          {getStatusLabel(unit.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {unit.floor}° andar{unit.tower ? ` • Torre ${unit.tower}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                {unit.proposalsCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{unit.proposalsCount} proposta(s)</span>
                      {unit.lastProposalDate && (
                        <>
                          <span>•</span>
                          <span>Última: {formatDate(unit.lastProposalDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
