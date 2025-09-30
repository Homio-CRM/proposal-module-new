'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CustomDatePicker } from '@/components/ui/date-picker'
import type { PropertyData } from '@/lib/types/proposal'

interface PropertyDataStepProps {
  data: PropertyData
  onDataChange: (data: PropertyData) => void
  errors?: Record<string, string>
}

export default function PropertyDataStep({ 
  data, 
  onDataChange,
  errors = {}
}: PropertyDataStepProps) {
  const [formData, setFormData] = useState<PropertyData>(data)
  

  useEffect(() => {
    setFormData(data)
  }, [data])


  const handleInputChange = (field: keyof PropertyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    onDataChange({ ...formData, [field]: value })
    
    if (errors[field]) {
      // Error cleared
    }
  }


  return (
    <div className="space-y-6">
      {/* First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="development" className="block text-sm font-medium text-neutral-700 mb-2">
            Empreendimento *
          </label>
          <Input
            id="development"
            type="text"
            value={formData.development}
            onChange={(e) => handleInputChange('development', e.target.value)}
            placeholder="Nome do empreendimento"
            className={errors['property.development'] ? 'border-red-500' : ''}
          />
          {errors['property.development'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.development']}</p>
          )}
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-neutral-700 mb-2">
            Unidade *
          </label>
          <Input
            id="unit"
            type="text"
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            placeholder="Ex: 101, 202, Apto 301"
            className={errors['property.unit'] ? 'border-red-500' : ''}
          />
          {errors['property.unit'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.unit']}</p>
          )}
        </div>

        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-neutral-700 mb-2">
            Pavimento *
          </label>
          <Input
            id="floor"
            type="text"
            value={formData.floor}
            onChange={(e) => handleInputChange('floor', e.target.value)}
            placeholder="Ex: 1º andar, 2º andar, Térreo"
            className={errors['property.floor'] ? 'border-red-500' : ''}
          />
          {errors['property.floor'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.floor']}</p>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="tower" className="block text-sm font-medium text-neutral-700 mb-2">
            Torre *
          </label>
          <Input
            id="tower"
            type="text"
            value={formData.tower}
            onChange={(e) => handleInputChange('tower', e.target.value)}
            placeholder="Ex: Torre A, Torre B, Bloco 1"
            className={errors['property.tower'] ? 'border-red-500' : ''}
          />
          {errors['property.tower'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.tower']}</p>
          )}
        </div>

        

        <div>
          <label htmlFor="reservedUntil" className="block text-sm font-medium text-neutral-700 mb-2">
            Reservado Até *
          </label>
          <CustomDatePicker
            value={formData.reservedUntil ? new Date(formData.reservedUntil) : null}
            onChange={(date) => handleInputChange('reservedUntil', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Selecione a data de reserva"
            minDate={new Date()}
            error={!!errors['property.reservedUntil']}
          />
          {errors['property.reservedUntil'] && (
            <p className="text-sm text-red-600 mt-1">{errors['property.reservedUntil']}</p>
          )}
        </div>
      </div>

      {/* Third Row - Observations */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-neutral-700 mb-2">
            Observações
          </label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            placeholder="Digite observações adicionais sobre o imóvel..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  )
}