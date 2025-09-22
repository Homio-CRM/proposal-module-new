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
          <div className="relative">
            <Input
              id="opportunityId"
              type="text"
              value={formData.opportunityId}
              onChange={(e) => handleInputChange('opportunityId', e.target.value)}
              placeholder="Digite o ID da oportunidade"
              className={`pr-10 ${errors.opportunityId ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-neutral-600 transition-colors"
              onClick={() => {
                if (formData.opportunityId.trim()) {
                  // TODO: Implementar busca da oportunidade
                  console.log('Buscando oportunidade:', formData.opportunityId)
                }
              }}
            >
              <svg
                className="h-4 w-4 text-neutral-400 hover:text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
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
