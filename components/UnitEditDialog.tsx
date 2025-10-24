'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { buildingService } from '@/lib/services/buildingService'
import { Unit } from '@/lib/types/building'

interface UnitEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onUpdated?: (updatedUnit: Unit) => void
}

export default function UnitEditDialog({ open, onOpenChange, unit, onUpdated }: UnitEditDialogProps) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [tower, setTower] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (unit) {
      setName(unit.name || '')
      setNumber(unit.number || '')
      setFloor(unit.floor || '')
      setTower(unit.tower || '')
    }
  }, [unit])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!number.trim()) e.number = 'Número é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!unit) return

    setSubmitting(true)
    try {
      const updatedUnit = await buildingService.updateUnit(unit.id, {
        name: name.trim(),
        number: number.trim(),
        floor: floor.trim(),
        tower: tower.trim()
      })

      onOpenChange(false)
      if (onUpdated) onUpdated(updatedUnit)
      setErrors({})
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao atualizar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (unit) {
      setName(unit.name || '')
      setNumber(unit.number || '')
      setFloor(unit.floor || '')
      setTower(unit.tower || '')
    }
    setErrors({})
    setFormError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Unidade</DialogTitle>
          <DialogDescription>Altere as informações da unidade</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unit-name" className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <Input 
              id="unit-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className={errors.name ? 'border-red-500' : ''} 
              disabled={submitting}
              placeholder="Nome da unidade"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="unit-number" className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
            <Input 
              id="unit-number" 
              value={number} 
              onChange={(e) => setNumber(e.target.value)} 
              className={errors.number ? 'border-red-500' : ''} 
              disabled={submitting}
              placeholder="Número da unidade"
            />
            {errors.number && (
              <p className="text-sm text-red-600 mt-1">{errors.number}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit-floor" className="block text-sm font-medium text-gray-700 mb-2">Andar</label>
              <Input 
                id="unit-floor" 
                value={floor} 
                onChange={(e) => setFloor(e.target.value)} 
                disabled={submitting}
                placeholder="Ex: 5"
              />
            </div>
            <div>
              <label htmlFor="unit-tower" className="block text-sm font-medium text-gray-700 mb-2">Torre</label>
              <Input 
                id="unit-tower" 
                value={tower} 
                onChange={(e) => setTower(e.target.value)} 
                disabled={submitting}
                placeholder="Ex: A"
              />
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

