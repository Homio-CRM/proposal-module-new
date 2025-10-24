"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabaseClient'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { mapStatusToDB } from '@/lib/services/buildingService'

interface UnitCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildingId: string
  onCreated?: () => void
}

export default function UnitCreateDialog({ open, onOpenChange, buildingId, onCreated }: UnitCreateDialogProps) {
  const { userData } = useUserDataContext()
  const [number, setNumber] = useState('')
  const [tower, setTower] = useState('')
  const [floor, setFloor] = useState('')
  const [status, setStatus] = useState<'livre' | 'reservado' | 'vendido'>('livre')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = 'Número é obrigatório'
    if (!tower.trim()) e.tower = 'Torre é obrigatória'
    if (!floor.trim()) e.floor = 'Andar é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!userData?.activeLocation) {
      setFormError('Usuário sem localização ativa')
      return
    }
    setSubmitting(true)
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('units')
        .insert({
          number: number.trim(),
          tower: tower.trim(),
          floor: floor.trim(),
          status: mapStatusToDB(status),
          building_id: buildingId,
          agency_id: userData.activeLocation
        })
      if (error) throw new Error(error.message)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_building_${buildingId}_${userData.activeLocation}`)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${userData.activeLocation}`)
      onOpenChange(false)
      if (onCreated) onCreated()
      setNumber('')
      setTower('')
      setFloor('')
      setStatus('livre')
      setErrors({})
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Unidade</DialogTitle>
          <DialogDescription>Preencha os dados da unidade</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unit-number" className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
            <Input id="unit-number" value={number} onChange={(e) => setNumber(e.target.value)} className={errors.number ? 'border-red-500' : ''} disabled={submitting} />
            {errors.number && (<p className="text-sm text-red-600 mt-1">{errors.number}</p>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit-tower" className="block text-sm font-medium text-gray-700 mb-2">Torre *</label>
              <Input id="unit-tower" value={tower} onChange={(e) => setTower(e.target.value)} className={errors.tower ? 'border-red-500' : ''} disabled={submitting} />
              {errors.tower && (<p className="text-sm text-red-600 mt-1">{errors.tower}</p>)}
            </div>
            <div>
              <label htmlFor="unit-floor" className="block text-sm font-medium text-gray-700 mb-2">Andar *</label>
              <Input id="unit-floor" value={floor} onChange={(e) => setFloor(e.target.value)} className={errors.floor ? 'border-red-500' : ''} disabled={submitting} />
              {errors.floor && (<p className="text-sm text-red-600 mt-1">{errors.floor}</p>)}
            </div>
          </div>
          <div>
            <label htmlFor="unit-status" className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <Select id="unit-status" value={status} onChange={(e) => setStatus(e.target.value as 'livre' | 'reservado' | 'vendido')} disabled={submitting}>
              <option value="livre">Livre</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </Select>
          </div>
          {formError && (<p className="text-sm text-red-600">{formError}</p>)}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>Criar Unidade</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 