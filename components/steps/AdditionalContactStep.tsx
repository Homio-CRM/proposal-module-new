'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { FormattedInput } from '@/components/ui/formatted-input'
import type { ContactData } from '@/lib/types/proposal'

// Funções de formatação
const formatCPF = (value: string): string => {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatCEP = (value: string): string => {
  return value.replace(/(\d{5})(\d{3})/, '$1-$2')
}

const formatPhone = (value: string): string => {
  if (value.length <= 10) {
    return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}

interface AdditionalContactStepProps {
  data: ContactData | undefined
  onDataChange: (data: ContactData | undefined) => void
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

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]

export default function AdditionalContactStep({ 
  data, 
  onDataChange,
  errors = {}
}: AdditionalContactStepProps) {
  const [formData, setFormData] = useState<ContactData>(data || {
    name: '',
    cpf: '',
    rg: '',
    rgIssuer: '',
    nationality: '',
    maritalStatus: '',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    city: '',
    neighborhood: '',
    state: '',
    profession: ''
  })

  useEffect(() => {
    if (data) {
      setFormData(data)
    }
  }, [data])

  const handleInputChange = (field: keyof ContactData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onDataChange(newData)
  }
  

  return (
    <div className="space-y-6">
      <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        <p className="text-sm text-neutral-600">
          <strong>Opcional:</strong> Preencha os dados do contato adicional se necessário. 
          Este passo pode ser pulado se não houver um segundo contato.
        </p>
      </div>

      {/* First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
            Nome Completo
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Digite o nome completo"
            className={errors['additionalContact.name'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.name'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.name']}</p>
          )}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-neutral-700 mb-2">
            CPF
          </label>
          <FormattedInput
            id="cpf"
            type="text"
            value={formData.cpf}
            onChange={(e) => handleInputChange('cpf', e.target.value)}
            placeholder="000.000.000-00"
            format={formatCPF}
            maxLength={11}
            className={errors['additionalContact.cpf'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.cpf'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.cpf']}</p>
          )}
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-neutral-700 mb-2">
            Data de Nascimento
          </label>
          <CustomDatePicker
            value={formData.birthDate ? new Date(formData.birthDate) : null}
            onChange={(date) => handleInputChange('birthDate', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Selecione a data de nascimento"
            maxDate={new Date()}
            error={!!errors['additionalContact.birthDate']}
          />
          {errors['additionalContact.birthDate'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.birthDate']}</p>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="rg" className="block text-sm font-medium text-neutral-700 mb-2">
            RG
          </label>
          <Input
            id="rg"
            type="text"
            value={formData.rg}
            onChange={(e) => handleInputChange('rg', e.target.value)}
            placeholder="Digite o RG"
            className={errors['additionalContact.rg'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.rg'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.rg']}</p>
          )}
        </div>

        <div>
          <label htmlFor="rgIssuer" className="block text-sm font-medium text-neutral-700 mb-2">
            Órgão Emissor do RG
          </label>
          <Input
            id="rgIssuer"
            type="text"
            value={formData.rgIssuer}
            onChange={(e) => handleInputChange('rgIssuer', e.target.value)}
            placeholder="Ex.: SSP-SP"
            className={errors['additionalContact.rgIssuer'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.rgIssuer'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.rgIssuer']}</p>
          )}
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-neutral-700 mb-2">
            Nacionalidade
          </label>
          <Input
            id="nationality"
            type="text"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            placeholder="Digite a nacionalidade"
            className={errors['additionalContact.nationality'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.nationality'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.nationality']}</p>
          )}
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-neutral-700 mb-2">
            Estado Civil
          </label>
          <Select
            id="maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            className={errors['additionalContact.maritalStatus'] ? 'border-red-500' : ''}
          >
            <option value="">Selecione o estado civil</option>
            {MARITAL_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors['additionalContact.maritalStatus'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.maritalStatus']}</p>
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
            className={errors['additionalContact.profession'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.profession'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.profession']}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
            Telefone
          </label>
          <FormattedInput
            id="phone"
            type="text"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(00) 00000-0000"
            format={formatPhone}
            maxLength={11}
            className={errors['additionalContact.phone'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.phone'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.phone']}</p>
          )}
        </div>
      </div>

      {/* Fourth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-neutral-700 mb-2">
            CEP
          </label>
          <FormattedInput
            id="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="00000-000"
            format={formatCEP}
            maxLength={8}
            className={errors['additionalContact.zipCode'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.zipCode'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.zipCode']}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-2">
            Endereço
          </label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Digite o endereço completo"
            className={errors['additionalContact.address'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.address'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.address']}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
            Cidade
          </label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Digite a cidade"
            className={errors['additionalContact.city'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.city'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.city']}</p>
          )}
        </div>
      </div>

      {/* Fifth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-neutral-700 mb-2">
            Bairro
          </label>
          <Input
            id="neighborhood"
            type="text"
            value={formData.neighborhood}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            placeholder="Digite o bairro"
            className={errors['additionalContact.neighborhood'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.neighborhood'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.neighborhood']}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Digite o e-mail"
            className={errors['additionalContact.email'] ? 'border-red-500' : ''}
          />
          {errors['additionalContact.email'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.email']}</p>
          )}
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-2">
            Estado
          </label>
          <Select
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={errors['additionalContact.state'] ? 'border-red-500' : ''}
          >
            <option value="">Selecione o estado</option>
            {BRAZILIAN_STATES.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </Select>
          {errors['additionalContact.state'] && (
            <p className="text-sm text-red-600 mt-1">{errors['additionalContact.state']}</p>
          )}
        </div>
      </div>
    </div>
  )
}