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
  const [name, setName] = useState('')
  const [grossPriceAmount, setGrossPriceAmount] = useState('')
  const [bedroomCount, setBedroomCount] = useState('')
  const [privateArea, setPrivateArea] = useState('')
  const [gardenArea, setGardenArea] = useState('')
  const [parkingSpaceCount, setParkingSpaceCount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const formatDecimalInput = (value: string, maxDecimals: number = 2): string => {
    value = value.replace(/[^\d,]/g, '')
    const parts = value.split(',')
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('')
    }
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      return parts[0] + ',' + parts[1].substring(0, maxDecimals)
    }
    return value
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = 'Número é obrigatório'
    if (!name.trim()) e.name = 'Nome é obrigatório'
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
          name: name.trim(),
          tower: tower.trim() || null,
          floor: floor.trim() || null,
          status: mapStatusToDB(status),
          building_id: buildingId,
          agency_id: userData.activeLocation,
          gross_price_amount: grossPriceAmount ? parseFloat(grossPriceAmount.replace(',', '.')) : 0,
          bedroom_count: bedroomCount ? parseInt(bedroomCount) : 0,
          private_area: privateArea ? parseFloat(privateArea.replace(',', '.')) : 0,
          garden_area: gardenArea ? parseFloat(gardenArea.replace(',', '.')) : 0,
          parking_space_count: parkingSpaceCount ? parseInt(parkingSpaceCount) : 0
        })
      if (error) throw new Error(error.message)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_building_${buildingId}_${userData.activeLocation}`)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${userData.activeLocation}`)
      onOpenChange(false)
      if (onCreated) onCreated()
      setNumber('')
      setName('')
      setTower('')
      setFloor('')
      setStatus('livre')
      setGrossPriceAmount('')
      setBedroomCount('')
      setPrivateArea('')
      setGardenArea('')
      setParkingSpaceCount('')
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
            <label htmlFor="unit-name" className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <Input id="unit-name" value={name} onChange={(e) => setName(e.target.value)} className={errors.name ? 'border-red-500' : ''} disabled={submitting} placeholder="Nome da unidade" />
            {errors.name && (<p className="text-sm text-red-600 mt-1">{errors.name}</p>)}
          </div>
          <div>
            <label htmlFor="unit-number" className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
            <Input id="unit-number" value={number} onChange={(e) => setNumber(e.target.value)} className={errors.number ? 'border-red-500' : ''} disabled={submitting} placeholder="Número da unidade" />
            {errors.number && (<p className="text-sm text-red-600 mt-1">{errors.number}</p>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit-tower" className="block text-sm font-medium text-gray-700 mb-2">Torre</label>
              <Input id="unit-tower" value={tower} onChange={(e) => setTower(e.target.value)} disabled={submitting} placeholder="Ex: A" />
            </div>
            <div>
              <label htmlFor="unit-floor" className="block text-sm font-medium text-gray-700 mb-2">Andar</label>
              <Input id="unit-floor" value={floor} onChange={(e) => setFloor(e.target.value)} disabled={submitting} placeholder="Ex: 5" />
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
          <div>
            <label htmlFor="unit-gross-price" className="block text-sm font-medium text-gray-700 mb-2">Valor Bruto</label>
            <Input id="unit-gross-price" type="text" value={grossPriceAmount} onChange={(e) => setGrossPriceAmount(formatDecimalInput(e.target.value))} disabled={submitting} placeholder="0,00" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit-bedroom-count" className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
              <Input id="unit-bedroom-count" type="number" value={bedroomCount} onChange={(e) => setBedroomCount(e.target.value)} disabled={submitting} placeholder="0" />
            </div>
            <div>
              <label htmlFor="unit-parking-count" className="block text-sm font-medium text-gray-700 mb-2">Vagas de Estacionamento</label>
              <Input id="unit-parking-count" type="number" value={parkingSpaceCount} onChange={(e) => setParkingSpaceCount(e.target.value)} disabled={submitting} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit-private-area" className="block text-sm font-medium text-gray-700 mb-2">Área Privativa (m²)</label>
              <Input id="unit-private-area" type="text" value={privateArea} onChange={(e) => setPrivateArea(formatDecimalInput(e.target.value))} disabled={submitting} placeholder="0,00" />
            </div>
            <div>
              <label htmlFor="unit-garden-area" className="block text-sm font-medium text-gray-700 mb-2">Área do Jardim (m²)</label>
              <Input id="unit-garden-area" type="text" value={gardenArea} onChange={(e) => setGardenArea(formatDecimalInput(e.target.value))} disabled={submitting} placeholder="0,00" />
            </div>
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