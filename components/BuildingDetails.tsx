'use client'

import { useState, useMemo, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Building, BuildingWithUnits, UnitStatus } from '@/lib/types/building'
import { 
  Building2, 
  Home,
  Users,
  Edit,
  Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import UnitCreateDialog from '@/components/UnitCreateDialog'
import BuildingEditDialog from '@/components/BuildingEditDialog'
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog'
import { buildingService } from '@/lib/services/buildingService'

interface BuildingDetailsProps {
  building: BuildingWithUnits
  statusFilter?: UnitStatus | 'all'
  onStatusFilterChange?: (status: UnitStatus | 'all') => void
  canManage?: boolean
  onBuildingUpdated?: (updatedBuilding: BuildingWithUnits) => void
}

export function BuildingDetails({ building, statusFilter = 'all', onStatusFilterChange, canManage = true, onBuildingUpdated }: BuildingDetailsProps) {
  const router = useRouter()
  const { userData } = useUserDataContext()
  const [openCreateUnit, setOpenCreateUnit] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({})
  const [currentBuilding, setCurrentBuilding] = useState(building)

  useEffect(() => {
    setCurrentBuilding(building)
  }, [building])

  const filteredUnits = useMemo(() => {
    const units = statusFilter === 'all' 
      ? currentBuilding.units 
      : currentBuilding.units.filter(unit => unit.status === statusFilter)
    
    const unitsWithTower = units.filter(unit => unit.tower && unit.tower.trim() !== '')
    const unitsWithoutTower = units.filter(unit => !unit.tower || unit.tower.trim() === '')
    
    const sortedWithTower = unitsWithTower.sort((a, b) => {
      const towerCompare = (a.tower || '').localeCompare(b.tower || '', 'pt-BR', { sensitivity: 'base' })
      if (towerCompare !== 0) return towerCompare
      return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
    })
    
    const sortedWithoutTower = unitsWithoutTower.sort((a, b) => {
      return (a.number || '').localeCompare(b.number || '', 'pt-BR', { numeric: true })
    })
    
    return [...sortedWithTower, ...sortedWithoutTower]
  }, [currentBuilding.units, statusFilter])



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
    router.push(`/buildings/${currentBuilding.id}/${unitId}`)
  }

  const handleBuildingUpdated = (updatedBuilding: Building) => {
    setCurrentBuilding({
      ...currentBuilding,
      ...updatedBuilding
    })
  }

  const handleDeleteBuilding = async () => {
    await buildingService.deleteBuilding(currentBuilding.id)
    router.push('/buildings')
  }

  const handleDeleteUnit = async () => {
    if (!unitToDelete || !userData?.activeLocation) return
    await buildingService.deleteUnit(unitToDelete)
    const updatedBuilding = await buildingService.fetchBuildingWithUnits(currentBuilding.id, userData.activeLocation)
    if (updatedBuilding) {
      setCurrentBuilding(updatedBuilding)
      onBuildingUpdated?.(updatedBuilding)
    }
    setDeleteUnitDialogOpen(false)
    setUnitToDelete(null)
  }

  const handleUnitStatusChange = async (unitId: string, newStatus: UnitStatus) => {
    const unit = currentBuilding.units.find(u => u.id === unitId)
    if (!unit || unit.status === newStatus || statusUpdating[unitId] || !userData?.activeLocation) return

    setStatusUpdating(prev => ({ ...prev, [unitId]: true }))

    try {
      await buildingService.updateUnitStatus(unitId, newStatus)
      const updatedBuilding = await buildingService.fetchBuildingWithUnits(currentBuilding.id, userData.activeLocation)
      if (updatedBuilding) {
        setCurrentBuilding(updatedBuilding)
        onBuildingUpdated?.(updatedBuilding)
      }
    } catch (error) {
      console.error('Erro ao atualizar status da unidade:', error)
    } finally {
      setStatusUpdating(prev => ({ ...prev, [unitId]: false }))
    }
  }

  const handleUnitCreated = async () => {
    if (!userData?.activeLocation) return
    const updatedBuilding = await buildingService.fetchBuildingWithUnits(currentBuilding.id, userData.activeLocation)
    if (updatedBuilding) {
      setCurrentBuilding(updatedBuilding)
      onBuildingUpdated?.(updatedBuilding)
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações do Empreendimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Informações do Empreendimento
            </CardTitle>
            {canManage && (
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
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="text-sm text-gray-900">{currentBuilding.name}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Endereço</label>
              <p className="text-sm text-gray-900">{currentBuilding.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cidade</label>
              <p className="text-sm text-gray-900">{currentBuilding.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <p className="text-sm text-gray-900">{currentBuilding.state}</p>
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
              <div className="text-2xl font-bold text-gray-900">{currentBuilding.totalUnits}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{currentBuilding.availableUnits}</div>
              <div className="text-sm text-green-600">Livres</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{currentBuilding.reservedUnits}</div>
              <div className="text-sm text-yellow-600">Reservadas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentBuilding.soldUnits}</div>
              <div className="text-sm text-blue-600">Vendidas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Unidades ({filteredUnits.length})
              {statusFilter !== 'all' && (
                <span className="text-sm text-gray-500 font-normal">
                  de {currentBuilding.units.length} total
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              {onStatusFilterChange && (
                <Select 
                  value={statusFilter} 
                  onChange={(e) => onStatusFilterChange(e.target.value as UnitStatus | 'all')}
                  className="w-[200px]"
                >
                  <option value="all">Todas as unidades</option>
                  <option value="livre">Unidades livres</option>
                  <option value="reservado">Unidades reservadas</option>
                  <option value="vendido">Unidades vendidas</option>
                </Select>
              )}
              {canManage && (
                <button className="px-3 py-2 text-sm border rounded-md" onClick={() => setOpenCreateUnit(true)}>Nova Unidade</button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUnits.map((unit) => (
              <div 
                key={unit.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-4 flex-1 cursor-pointer"
                    onClick={() => handleUnitClick(unit.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Home className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {unit.name || `Unidade ${unit.number}`}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(unit.status)}>
                          {getStatusLabel(unit.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {unit.floor ? `${unit.floor}° andar` : ''}{unit.floor && unit.tower ? ' • ' : ''}{unit.tower ? `Torre ${unit.tower}` : ''}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={unit.status}
                        onChange={(e) => handleUnitStatusChange(unit.id, e.target.value as UnitStatus)}
                        disabled={statusUpdating[unit.id]}
                        className="w-32"
                      >
                        <option value="livre">Livre</option>
                        <option value="reservado">Reservado</option>
                        <option value="vendido">Vendido</option>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUnitToDelete(unit.id)
                          setDeleteUnitDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {canManage && (
        <>
          <UnitCreateDialog 
            open={openCreateUnit} 
            onOpenChange={setOpenCreateUnit} 
            buildingId={currentBuilding.id}
            onCreated={handleUnitCreated}
          />
          
          <BuildingEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            building={currentBuilding}
            onUpdated={handleBuildingUpdated}
          />

          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteBuilding}
            title="Deletar Empreendimento"
            description={`Tem certeza que deseja deletar o empreendimento "${currentBuilding.name}"?`}
            itemName={currentBuilding.name}
            itemType="empreendimento"
          />

          <DeleteConfirmationDialog
            open={deleteUnitDialogOpen}
            onOpenChange={setDeleteUnitDialogOpen}
            onConfirm={handleDeleteUnit}
            title="Deletar Unidade"
            description={unitToDelete ? `Tem certeza que deseja deletar a unidade "${currentBuilding.units.find(u => u.id === unitToDelete)?.number || unitToDelete}"?` : ''}
            itemName={unitToDelete ? currentBuilding.units.find(u => u.id === unitToDelete)?.number || unitToDelete : ''}
            itemType="unidade"
          />
        </>
      )}
    </div>
  )
}
