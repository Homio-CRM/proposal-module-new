'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { getStatusBadgeVariant, getStatusLabel } from '@/lib/utils/proposalStatus'
import { ProposalStatus } from '@/lib/types/proposal'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'

interface ProposalStatusChangerProps {
  proposalId: string
  currentStatus: ProposalStatus
  unitId?: string
  onStatusChange: (newStatus: ProposalStatus, updateUnitStatus?: boolean, reservedUntil?: string) => Promise<void>
  disabled?: boolean
}

const statusOptions: { value: ProposalStatus; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'em_analise', label: 'Em Análise', icon: Clock, color: 'text-yellow-600' },
  { value: 'aprovada', label: 'Aprovada', icon: CheckCircle, color: 'text-green-600' },
  { value: 'negada', label: 'Negada', icon: XCircle, color: 'text-red-600' }
]

export function ProposalStatusChanger({ proposalId, currentStatus, unitId, onStatusChange, disabled = false }: ProposalStatusChangerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ProposalStatus | null>(null)
  const [updateUnitStatus, setUpdateUnitStatus] = useState(false)
  const [reservedUntil, setReservedUntil] = useState<Date | null>(null)

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    if (newStatus === currentStatus || isUpdating || disabled) return

    if ((newStatus === 'aprovada' || newStatus === 'negada') && unitId) {
      setPendingStatus(newStatus)
      setUpdateUnitStatus(true)
      setReservedUntil(null)
      setShowConfirmDialog(true)
      return
    }

    if (newStatus === 'em_analise' && (currentStatus === 'aprovada' || currentStatus === 'negada') && unitId) {
      setPendingStatus(newStatus)
      setUpdateUnitStatus(true)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      setReservedUntil(tomorrow)
      setShowConfirmDialog(true)
      return
    }

    try {
      setIsUpdating(true)
      await onStatusChange(newStatus, false)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status da proposta')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!pendingStatus || disabled) return

    if (pendingStatus === 'em_analise' && updateUnitStatus) {
      if (!reservedUntil) {
        alert('Por favor, selecione uma data para reservar a unidade')
        return
      }
      
      const selectedDate = new Date(reservedUntil)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        alert('Por favor, selecione uma data futura para reservar a unidade')
        return
      }
    }

    try {
      setIsUpdating(true)
      setShowConfirmDialog(false)
      const reservedUntilString = pendingStatus === 'em_analise' && updateUnitStatus && reservedUntil
        ? `${reservedUntil.getFullYear()}-${String(reservedUntil.getMonth() + 1).padStart(2, '0')}-${String(reservedUntil.getDate()).padStart(2, '0')}`
        : undefined
      
      await onStatusChange(
        pendingStatus, 
        updateUnitStatus, 
        reservedUntilString
      )
      setPendingStatus(null)
      setUpdateUnitStatus(false)
      setReservedUntil(null)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status da proposta')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false)
    setPendingStatus(null)
    setUpdateUnitStatus(false)
    setReservedUntil(null)
  }

  const getConfirmDialogContent = () => {
    if (pendingStatus === 'aprovada') {
      return {
        title: 'Confirmar alteração de status',
        description: 'Deseja alterar o status da proposta para "Aprovada" e também marcar a unidade como "Vendida"?',
        checkboxLabel: 'Marcar unidade como vendida',
        showDateInput: false
      }
    } else if (pendingStatus === 'negada') {
      return {
        title: 'Confirmar alteração de status',
        description: 'Deseja alterar o status da proposta para "Negada" e também liberar a unidade?',
        checkboxLabel: 'Liberar unidade (marcar como disponível)',
        showDateInput: false
      }
    } else if (pendingStatus === 'em_analise') {
      return {
        title: 'Confirmar alteração de status',
        description: 'Deseja alterar o status da proposta para "Em Análise" e também reservar a unidade?',
        checkboxLabel: 'Reservar unidade',
        showDateInput: true
      }
    }
    return {
      title: 'Confirmar alteração de status',
      description: 'Deseja alterar o status da proposta?',
      checkboxLabel: '',
      showDateInput: false
    }
  }

  const dialogContent = getConfirmDialogContent()

  return (
    <>
      <Card className="border-2 border-primary-200 bg-primary-50">
        <CardHeader>
          <CardTitle className="text-lg">Status da Proposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status atual:</span>
              <Badge variant={getStatusBadgeVariant(currentStatus)}>
                {getStatusLabel(currentStatus)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Alterar para:</span>
              <div className="flex gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = currentStatus === option.value
                  const isDisabled = isUpdating || isActive || disabled

                  return (
                    <Button
                      key={option.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(option.value)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 ${
                        isActive 
                          ? 'bg-primary-600 hover:bg-primary-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {isUpdating && !isActive ? (
                        <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : option.color}`} />
                      )}
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          {unitId && (
            <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-unit-status"
                  checked={updateUnitStatus}
                      onCheckedChange={(checked) => setUpdateUnitStatus(checked === true)}
                      disabled={disabled}
                />
                <label
                  htmlFor="update-unit-status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {dialogContent.checkboxLabel}
                </label>
              </div>
              {dialogContent.showDateInput && updateUnitStatus && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="reserved-until">Reservar até:</Label>
                  <CustomDatePicker
                    value={reservedUntil}
                    onChange={(date) => setReservedUntil(date)}
                    placeholder="Selecione uma data"
                    minDate={(() => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      tomorrow.setHours(0, 0, 0, 0)
                      return tomorrow
                    })()}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
              <Button variant="outline" onClick={handleCancelConfirm}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={disabled}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

