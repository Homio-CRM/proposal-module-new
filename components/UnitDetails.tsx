'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Unit, Building, UnitStatus } from '@/lib/types/building'
import { 
  Home, 
  Building2, 
  MapPin,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import UnitEditDialog from './UnitEditDialog'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import { buildingService } from '@/lib/services/buildingService'

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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentUnit, setCurrentUnit] = useState(unit)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [webhookErrorDialogOpen, setWebhookErrorDialogOpen] = useState(false)




  const handleBuildingClick = () => {
    router.push(`/buildings/${building.id}`)
  }

  const handleUnitUpdated = (updatedUnit: Unit) => {
    setCurrentUnit({
      ...updatedUnit,
      building: currentUnit.building
    })
  }

  const handleDeleteUnit = async () => {
    await buildingService.deleteUnit(currentUnit.id)
    router.push(`/buildings/${building.id}`)
  }

  const handleStatusChange = async (newStatus: UnitStatus) => {
    if (newStatus === currentUnit.status || statusUpdating) return

    setStatusUpdating(true)
    const previousStatus = currentUnit.status

    setCurrentUnit(prev => ({
      ...prev,
      status: newStatus
    }))

    try {
      await buildingService.updateUnitStatus(currentUnit.id, newStatus)
    } catch (error) {
      setCurrentUnit(prev => ({
        ...prev,
        status: previousStatus
      }))
      
      if (error && typeof error === 'object' && 'webhookError' in error) {
        setWebhookErrorDialogOpen(true)
      }
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações da Unidade */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary-600" />
              Informações da Unidade
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="text-sm text-gray-900">{currentUnit.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Número</label>
              <p className="text-sm text-gray-900">{currentUnit.number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Select
                  value={currentUnit.status}
                  onChange={(e) => handleStatusChange(e.target.value as UnitStatus)}
                  disabled={statusUpdating}
                  className="w-32"
                >
                  <option value="livre">Livre</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </Select>
              </div>
            </div>
            {currentUnit.floor && (
              <div>
                <label className="text-sm font-medium text-gray-700">Andar</label>
                <p className="text-sm text-gray-900">{currentUnit.floor}° andar</p>
              </div>
            )}
            {currentUnit.tower && (
              <div>
                <label className="text-sm font-medium text-gray-700">Torre</label>
                <p className="text-sm text-gray-900">{currentUnit.tower}</p>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UnitEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        unit={currentUnit}
        onUpdated={handleUnitUpdated}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteUnit}
        title="Deletar Unidade"
        description={`Tem certeza que deseja deletar a unidade "${currentUnit.name || currentUnit.number}"?`}
        itemName={currentUnit.name || `Unidade ${currentUnit.number}`}
        itemType="unidade"
      />

      <Dialog open={webhookErrorDialogOpen} onOpenChange={setWebhookErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao atualizar status
            </DialogTitle>
            <DialogDescription className="pt-2">
              Ocorreu um erro ao atualizar o status da unidade. Por favor, entre em contato com os desenvolvedores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setWebhookErrorDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
