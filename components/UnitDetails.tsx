'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Unit, Building, UnitStatus, MonthlyAdjustmentRate } from '@/lib/types/building'
import { 
  Home, 
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import UnitEditDialog from './UnitEditDialog'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import MonthlyAdjustmentRatesEditDialog from './MonthlyAdjustmentRatesEditDialog'
import { buildingService } from '@/lib/services/buildingService'

interface UnitWithBuilding extends Unit {
  building: Building
}

interface UnitDetailsProps {
  unitWithBuilding: UnitWithBuilding
  canManage?: boolean
}

export function UnitDetails({ unitWithBuilding, canManage = true }: UnitDetailsProps) {
  const router = useRouter()
  const unit = unitWithBuilding
  const building = unitWithBuilding.building
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editRatesDialogOpen, setEditRatesDialogOpen] = useState(false)
  const [currentUnit, setCurrentUnit] = useState(unit)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [webhookErrorDialogOpen, setWebhookErrorDialogOpen] = useState(false)




  const handleUnitUpdated = (updatedUnit: Unit) => {
    setCurrentUnit({
      ...updatedUnit,
      building: currentUnit.building
    })
  }

  const handleDeleteUnit = async () => {
    if (!canManage) return
    await buildingService.deleteUnit(currentUnit.id)
    router.push(`/buildings/${building.id}`)
  }


  const handleStatusChange = async (newStatus: UnitStatus) => {
    if (!canManage || newStatus === currentUnit.status || statusUpdating) return

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
                  disabled={statusUpdating || !canManage}
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
            <div>
              <label className="text-sm font-medium text-gray-700">Taxa de Correção</label>
              <p className="text-sm text-gray-900">
                {currentUnit.price_correction_rate !== undefined && currentUnit.price_correction_rate !== null
                  ? `${((1 + currentUnit.price_correction_rate) * 100).toFixed(2)}%`
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor Atual</label>
              <p className="text-lg font-bold text-primary-600">
                {currentUnit.current_value && !isNaN(currentUnit.current_value)
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentUnit.current_value)
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quartos</label>
              <p className="text-sm text-gray-900">
                {currentUnit.bedroom_count !== undefined && currentUnit.bedroom_count !== null && !isNaN(currentUnit.bedroom_count)
                  ? currentUnit.bedroom_count
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vagas de Estacionamento</label>
              <p className="text-sm text-gray-900">
                {currentUnit.parking_space_count !== undefined && currentUnit.parking_space_count !== null && !isNaN(currentUnit.parking_space_count)
                  ? currentUnit.parking_space_count
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Área Privativa</label>
              <p className="text-sm text-gray-900">
                {currentUnit.private_area && !isNaN(currentUnit.private_area)
                  ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUnit.private_area)} m²`
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Área do Jardim</label>
              <p className="text-sm text-gray-900">
                {currentUnit.garden_area && !isNaN(currentUnit.garden_area)
                  ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUnit.garden_area)} m²`
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Área Total</label>
              <p className="text-sm text-gray-900">
                {currentUnit.total_area && !isNaN(currentUnit.total_area)
                  ? `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUnit.total_area)} m²`
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary-600" />
              Taxas de Ajuste Mensal
            </CardTitle>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditRatesDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentUnit.monthly_adjustment_rates && currentUnit.monthly_adjustment_rates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Ano</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Jan</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Fev</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Mar</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Abr</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Mai</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Jun</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Jul</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Ago</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Set</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Out</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Nov</th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-gray-700">Dez</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUnit.monthly_adjustment_rates.map((rate: MonthlyAdjustmentRate, index: number) => {
                    const months = [
                      rate.january_rate || 0,
                      rate.february_rate || 0,
                      rate.march_rate || 0,
                      rate.april_rate || 0,
                      rate.may_rate || 0,
                      rate.june_rate || 0,
                      rate.july_rate || 0,
                      rate.august_rate || 0,
                      rate.september_rate || 0,
                      rate.october_rate || 0,
                      rate.november_rate || 0,
                      rate.december_rate || 0
                    ]
                    const isFirstRow = index === 0
                    return (
                      <tr key={rate.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{rate.year}</td>
                        {months.map((monthRate, monthIndex) => (
                          <td key={monthIndex} className="text-center py-3 px-2 text-sm text-gray-700">
                            {monthRate > 0 ? `${(monthRate * 100).toFixed(2)}%` : '-'}
                          </td>
                        ))}
                        <td className="text-center py-3 px-4 font-semibold text-gray-900">
                          {isFirstRow && currentUnit.price_correction_rate && currentUnit.price_correction_rate > 0
                            ? `${(currentUnit.price_correction_rate * 100).toFixed(2)}%`
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma taxa de ajuste mensal cadastrada</p>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <>
          <UnitEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            unit={currentUnit}
            onUpdated={handleUnitUpdated}
          />

          <MonthlyAdjustmentRatesEditDialog
            open={editRatesDialogOpen}
            onOpenChange={setEditRatesDialogOpen}
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
        </>
      )}

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
