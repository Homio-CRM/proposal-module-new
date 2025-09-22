'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Unit, Building } from '@/lib/types/building'
import { 
  Home, 
  Building2, 
  MapPin,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UnitWithBuilding extends Unit {
  building: Building
}

interface UnitDetailsProps {
  unitWithBuilding: UnitWithBuilding
}

export function UnitDetails({ unitWithBuilding }: UnitDetailsProps) {
  const router = useRouter()
  const unit = unitWithBuilding
  const building = unitWithBuilding.building


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

  const handleBuildingClick = () => {
    router.push(`/buildings/${building.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Informações da Unidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary-600" />
            Informações da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Número</label>
              <p className="text-sm text-gray-900">{unit.number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID</label>
              <p className="text-sm text-gray-900">{unit.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(unit.status)}>
                  {getStatusLabel(unit.status)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Andar</label>
              <p className="text-sm text-gray-900">{unit.floor}° andar</p>
            </div>
            {unit.tower && (
              <div>
                <label className="text-sm font-medium text-gray-700">Torre</label>
                <p className="text-sm text-gray-900">{unit.tower}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empreendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Empreendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={handleBuildingClick}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                  {building.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{building.address}, {building.city} - {building.state}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ID: {building.id}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Histórico de Propostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unit.proposalsCount > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {unit.proposalsCount} proposta(s) feita(s)
                    </div>
                    {unit.lastProposalDate && (
                      <div className="text-sm text-gray-600">
                        Última proposta em {formatDate(unit.lastProposalDate)}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/proposals')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver Propostas
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma proposta ainda
              </h3>
              <p className="text-gray-600 mb-4">
                Esta unidade ainda não possui propostas cadastradas.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/proposals/create')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Criar Proposta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
