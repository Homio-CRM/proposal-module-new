'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { buildingService } from '@/lib/services/buildingService'
import { Building } from '@/lib/types/building'

interface BuildingEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  building: Building | null
  onUpdated?: (updatedBuilding: Building) => void
}

export default function BuildingEditDialog({ open, onOpenChange, building, onUpdated }: BuildingEditDialogProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (building) {
      setName(building.name || '')
      setAddress(building.address || '')
      setCity(building.city || '')
      setState(building.state || '')
    }
  }, [building])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!address.trim()) e.address = 'Endereço é obrigatório'
    if (!city.trim()) e.city = 'Cidade é obrigatória'
    if (!state.trim()) e.state = 'Estado é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!building) return

    setSubmitting(true)
    try {
      const updatedBuilding = await buildingService.updateBuilding(building.id, {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim()
      })

      onOpenChange(false)
      if (onUpdated) onUpdated(updatedBuilding)
      setErrors({})
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao atualizar empreendimento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (building) {
      setName(building.name || '')
      setAddress(building.address || '')
      setCity(building.city || '')
      setState(building.state || '')
    }
    setErrors({})
    setFormError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empreendimento</DialogTitle>
          <DialogDescription>Altere as informações do empreendimento</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="building-name" className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <Input 
              id="building-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={errors.name ? 'border-red-500' : ''} 
              disabled={submitting}
              placeholder="Nome do empreendimento"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="building-address" className="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
            <Input 
              id="building-address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              className={errors.address ? 'border-red-500' : ''} 
              disabled={submitting}
              placeholder="Endereço completo"
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="building-city" className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
              <Input 
                id="building-city" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className={errors.city ? 'border-red-500' : ''} 
                disabled={submitting}
                placeholder="Cidade"
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label htmlFor="building-state" className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
              <Input 
                id="building-state" 
                value={state} 
                onChange={(e) => setState(e.target.value)} 
                className={errors.state ? 'border-red-500' : ''} 
                disabled={submitting}
                placeholder="Estado"
              />
              {errors.state && (
                <p className="text-sm text-red-600 mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

