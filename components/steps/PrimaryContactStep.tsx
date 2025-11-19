'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { parseISODateToLocal } from '@/lib/utils/date'
import { FormattedInput } from '@/components/ui/formatted-input'
import type { ContactData } from '@/lib/types/proposal'

// Funções de formatação progressiva
const formatCPF = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica formatação progressiva
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }
}

const formatCEP = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica formatação progressiva
  if (numbers.length <= 5) {
    return numbers
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }
}

const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica formatação progressiva
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
}

interface PrimaryContactStepProps {
  data: ContactData
  onDataChange: (data: ContactData) => void
  errors?: Record<string, string>
}

const MARITAL_STATUS_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' }
]

const NATIONALITY_OPTIONS = [
  { value: 'brasileira', label: 'Brasileira' },
  { value: 'estrangeira', label: 'Estrangeira' }
]


export default function PrimaryContactStep({ 
  data, 
  onDataChange,
  errors = {}
}: PrimaryContactStepProps) {
  const [formData, setFormData] = useState<ContactData>(data)
  

  useEffect(() => {
    setFormData(data)
  }, [data])


  const handleInputChange = (field: keyof ContactData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onDataChange(newData)
  }


  return (
    <div className="space-y-6">
      {/* First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
            Nome Completo *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Digite o nome completo"
            className={errors['primaryContact.name'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.name'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.name']}</p>
          )}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-neutral-700 mb-2">
            CPF *
          </label>
          <FormattedInput
            id="cpf"
            type="text"
            value={formData.cpf}
            onChange={(e) => handleInputChange('cpf', e.target.value)}
            placeholder="000.000.000-00"
            format={formatCPF}
            maxLength={11}
            className={errors['primaryContact.cpf'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.cpf'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.cpf']}</p>
          )}
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-700 mb-2">
            Data de Nascimento
          </label>
          <CustomDatePicker
            value={parseISODateToLocal(formData.birthDate)}
            onChange={(date) => handleInputChange('birthDate', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Selecione a data de nascimento"
            maxDate={new Date()}
            error={!!errors['primaryContact.birthDate']}
          />
          {errors['primaryContact.birthDate'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.birthDate']}</p>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="rg" className="block text-sm font-medium text-neutral-700 mb-2">
            RG *
          </label>
          <Input
            id="rg"
            type="text"
            value={formData.rg}
            onChange={(e) => handleInputChange('rg', e.target.value)}
            placeholder="Digite o RG"
            className={errors['primaryContact.rg'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.rg'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.rg']}</p>
          )}
        </div>

        <div>
          <label htmlFor="rgIssuer" className="block text-sm font-medium text-neutral-700 mb-2">
            Órgão Emissor do RG *
          </label>
          <Input
            id="rgIssuer"
            type="text"
            value={formData.rgIssuer}
            onChange={(e) => handleInputChange('rgIssuer', e.target.value)}
            placeholder="Ex.: SSP-SP"
            className={errors['primaryContact.rgIssuer'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.rgIssuer'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.rgIssuer']}</p>
          )}
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-neutral-700 mb-2">
            Nacionalidade *
          </label>
          <Select
            id="nationality"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className={errors['primaryContact.nationality'] ? 'border-red-500' : ''}
          >
            <option value="">Selecione a nacionalidade</option>
            {NATIONALITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors['primaryContact.nationality'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.nationality']}</p>
          )}
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-neutral-700 mb-2">
            Estado Civil *
          </label>
          <Select
            id="maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            className={errors['primaryContact.maritalStatus'] ? 'border-red-500' : ''}
          >
            <option value="">Selecione o estado civil</option>
            {MARITAL_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors['primaryContact.maritalStatus'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.maritalStatus']}</p>
          )}
        </div>

        <div>
          <label htmlFor="profession" className="block text-sm font-medium text-neutral-700 mb-2">
            Profissão
          </label>
          <Input
            id="profession"
            type="text"
            value={formData.profession || ''}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            placeholder="Digite a profissão"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
            Telefone *
          </label>
          <FormattedInput
            id="phone"
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(00) 00000-0000"
            format={formatPhone}
            maxLength={11}
            className={errors['primaryContact.phone'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.phone'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.phone']}</p>
          )}
        </div>

        
      </div>

      {/* Fourth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
            E-mail *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Digite o e-mail"
            className={errors['primaryContact.email'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.email'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.email']}</p>
          )}
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-neutral-700 mb-2">
            CEP *
          </label>
          <FormattedInput
            id="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="00000-000"
            format={formatCEP}
            maxLength={8}
            className={errors['primaryContact.zipCode'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.zipCode'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.zipCode']}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-2">
            Endereço *
          </label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Digite o endereço completo"
            className={errors['primaryContact.address'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.address'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.address']}</p>
          )}
        </div>
      </div>

      {/* Fifth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
            Cidade *
          </label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Digite a cidade"
            className={errors['primaryContact.city'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.city'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.city']}</p>
          )}
        </div>

        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-neutral-700 mb-2">
            Bairro *
          </label>
          <Input
            id="neighborhood"
            type="text"
            value={formData.neighborhood}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            placeholder="Digite o bairro"
            className={errors['primaryContact.neighborhood'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.neighborhood'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.neighborhood']}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-2">
            Estado *
          </label>
          <Input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="Digite o estado"
            className={errors['primaryContact.state'] ? 'border-red-500' : ''}
          />
          {errors['primaryContact.state'] && (
            <p className="text-sm text-red-600 mt-1">{errors['primaryContact.state']}</p>
          )}
        </div>
      </div>
    </div>
  )
}