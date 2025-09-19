'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { CustomDatePicker } from '@/components/ui/date-picker'
import type { ProposalData } from '@/lib/types/proposal'

interface ProposalDataStepProps {
  data: ProposalData
  onDataChange: (data: ProposalData) => void
  errors?: Record<string, string>
}

export default function ProposalDataStep({ 
  data, 
  onDataChange,
  errors = {}
}: ProposalDataStepProps) {
  const [formData, setFormData] = useState<ProposalData>(data)
  

  useEffect(() => {
    setFormData(data)
  }, [data])
  


  const handleInputChange = (field: keyof ProposalData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onDataChange(newData)
  }


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label htmlFor="opportunityId" className="block text-sm font-medium text-neutral-700 mb-2">
            ID da Oportunidade *
          </label>
          <Input
            id="opportunityId"
            type="text"
            value={formData.opportunityId}
            onChange={(e) => handleInputChange('opportunityId', e.target.value)}
            placeholder="Digite o ID da oportunidade"
            className={errors.opportunityId ? 'border-red-500' : ''}
          />
          {errors.opportunityId && (
            <p className="text-sm text-red-600 mt-1">{errors.opportunityId}</p>
          )}
        </div>

        <div>
          <label htmlFor="proposalDate" className="block text-sm font-medium text-neutral-700 mb-2">
            Data da Proposta *
          </label>
          <CustomDatePicker
            value={formData.proposalDate ? new Date(formData.proposalDate) : null}
            onChange={(date) => handleInputChange('proposalDate', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Selecione a data da proposta"
            error={!!errors['proposalDate']}
          />
          {errors['proposalDate'] && (
            <p className="text-sm text-red-600 mt-1">{errors['proposalDate']}</p>
          )}
        </div>
      </div>
    </div>
  )
}
