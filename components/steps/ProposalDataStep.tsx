'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { API_ENDPOINTS } from '@/lib/config/performance'
import type { ProposalData } from '@/lib/types/proposal'
import type { ContactData as ContactFormContactData } from '@/lib/types/proposal'

interface ProposalDataStepProps {
  data: ProposalData
  onDataChange: (data: ProposalData) => void
  errors?: Record<string, string>
  onPrimaryContactPrefill?: (data: { name?: string; phone?: string; email?: string; cpf?: string; rg?: string; rgIssuer?: string; nationality?: string; maritalStatus?: string; birthDate?: string; zipCode?: string; address?: string; city?: string; state?: string; neighborhood?: string; profession?: string }) => void
}

function normalizeMaritalStatus(value: unknown): string {
  if (!value) return ''
  const raw = String(value)
  const v = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z_ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (['solteiro', 'solteira', 'solteiroa', 'single'].includes(v)) return 'solteiro'
  if (['casado', 'casada', 'casadoa', 'married'].includes(v)) return 'casado'
  if (['divorciado', 'divorciada', 'divorciadoa', 'divorced'].includes(v)) return 'divorciado'
  if (['viuvo', 'viuva', 'viuvoa', 'widowed'].includes(v)) return 'viuvo'
  if (['uniao estavel', 'uniao_estavel', 'stable union', 'stable_union'].includes(v)) return 'uniao_estavel'
  return v
}

function toISODateString(input: unknown): string {
  if (!input) return ''
  const s = String(input)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return ''
}

function addOneDayISO(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function extractCustomFieldString(field: Record<string, unknown>): string | null {
  const v = field.value ?? field.fieldValueString ?? field.fieldValueLabel ?? field.fieldValueFormatted ?? field.fieldValueDate
  if (v === undefined || v === null) return null
  if (v instanceof Date) return v.toISOString().split('T')[0]
  const str = String(v)
  // date-like
  if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return toISODateString(str)
  }
  return str
}

export default function ProposalDataStep({ 
  data, 
  onDataChange,
  errors = {},
  onPrimaryContactPrefill
}: ProposalDataStepProps) {
  const [formData, setFormData] = useState<ProposalData>(data)
  
  
  const [opportunityError, setOpportunityError] = useState<string>('')
  const [isSearchingOpportunity, setIsSearchingOpportunity] = useState(false)
  const { userData } = useUserDataContext()
  const { getAllMappings } = useCustomFieldsContext()
  
  

  

  const handleInputChange = (field: keyof ProposalData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onDataChange(newData)
    
    if (field === 'opportunityId' && opportunityError) {
      setOpportunityError('')
    }
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
              className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSearchingOpportunity}
              onClick={async () => {
                const opportunityId = formData.opportunityId.trim()
                const locationId = userData?.activeLocation || ''
                
                if (!opportunityId || !locationId) {
                  setOpportunityError('ID da oportunidade e localização são obrigatórios')
                  return
                }

                setIsSearchingOpportunity(true)
                setOpportunityError('')

                try {
                  const oppRes = await fetch(API_ENDPOINTS.OPERATIONS.GET_OPPORTUNITY, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ opportunityId, locationId })
                  })
                  
                  if (!oppRes.ok) {
                    if (oppRes.status === 404) {
                      setOpportunityError('Oportunidade não encontrada')
                    } else {
                      setOpportunityError('Erro ao buscar oportunidade')
                    }
                    return
                  }

                  const opp = await oppRes.json()
                  
                  if (!opp || !opp.name) {
                    setOpportunityError('Oportunidade não encontrada')
                    return
                  }

                  const fieldMappings = getAllMappings()
                  const updatedData = { ...formData }
                  
                  if (opp.name) {
                    updatedData.proposalName = opp.name
                  }
                  
                  if (opp.customFields && Array.isArray(opp.customFields)) {
                    const opportunityCustomFields: Record<string, string> = {}
                    ;(opp.customFields as Array<{ id?: string; fieldValueString?: string; fieldValueDate?: string }>).
                      forEach((field) => {
                        if (field.id && field.fieldValueString !== undefined) {
                          opportunityCustomFields[field.id] = String(field.fieldValueString)
                        } else if (field.id && field.fieldValueDate !== undefined) {
                          opportunityCustomFields[field.id] = new Date(field.fieldValueDate).toISOString().split('T')[0]
                        }
                      })
                    
                    fieldMappings.opportunityFields.forEach(mapping => {
                      const customFieldValue = opportunityCustomFields[mapping.customFieldId]
                      if (customFieldValue !== undefined && customFieldValue !== null) {
                        switch (mapping.formField) {
                          case 'responsavel':
                            updatedData.responsible = customFieldValue
                            break
                          case 'empreendimento':
                          case 'unidade':
                          case 'andar':
                          case 'torre':
                          case 'observacoes':
                            break
                        }
                      }
                    })
                  }
                  
                  setFormData(updatedData)
                  onDataChange(updatedData)
                  
                  if (opp?.contactId) {
                    const contactRes = await fetch(API_ENDPOINTS.OPERATIONS.GET_CONTACT, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ contactId: opp.contactId, locationId })
                    })
                    if (contactRes.ok) {
                      const payload = await contactRes.json()
                      const c = payload?.contact ?? payload
                      const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                      const rawName = c?.fullNameLowerCase || [c?.firstName, c?.lastName].filter(Boolean).join(' ')
                      const name = rawName ? toTitleCase(rawName) : ''
                      const email = c?.email || c?.emailLowerCase || ''
                      const phone = c?.phone || ''
                      
                      const contactFieldMappings = getAllMappings()
                      const contactData: Partial<ContactFormContactData> = {}
                      
                      if (name) contactData.name = name
                      if (email) contactData.email = email
                      if (phone) contactData.phone = phone
                      if (c.postalCode) contactData.zipCode = c.postalCode
                      if (c.city) contactData.city = c.city
                      if (c.address1) contactData.address = c.address1
                      if (c.state) contactData.state = c.state
                      if (c.dateOfBirth) contactData.birthDate = addOneDayISO(toISODateString(c.dateOfBirth))
                      
                      if (c.customFields && Array.isArray(c.customFields)) {
                        const contactCustomFields: Record<string, string> = {}
                        ;(c.customFields as Array<Record<string, unknown>>).forEach((field) => {
                          const id = String(field.id ?? '')
                          if (!id) return
                          const str = extractCustomFieldString(field)
                          if (str !== null) contactCustomFields[id] = str
                        })
                        
                        contactFieldMappings.contactFields.forEach(mapping => {
                          const customFieldValue = contactCustomFields[mapping.customFieldId]
                          if (customFieldValue !== undefined && customFieldValue !== null) {
                            switch (mapping.formField) {
                              case 'cpf':
                                contactData.cpf = String(customFieldValue)
                                break
                              case 'rg':
                                contactData.rg = String(customFieldValue)
                                break
                              case 'orgaoEmissor':
                              case 'rg__orgao_emissor':
                                contactData.rgIssuer = String(customFieldValue)
                                break
                              case 'nacionalidade':
                                contactData.nationality = String(customFieldValue)
                                break
                              case 'estadoCivil':
                              case 'estado_civil':
                                console.log('[EstadoCivil] mappingId:', mapping.customFieldId, 'raw:', customFieldValue)
                                const normalized = normalizeMaritalStatus(customFieldValue)
                                console.log('[EstadoCivil] normalized:', normalized)
                                contactData.maritalStatus = normalized
                                break
                              case 'profissao':
                                contactData.profession = String(customFieldValue)
                                break
                              case 'cep':
                                contactData.zipCode = String(customFieldValue)
                                break
                              case 'endereco':
                                contactData.address = String(customFieldValue)
                                break
                              case 'cidade':
                                contactData.city = String(customFieldValue)
                                break
                              case 'bairro':
                                contactData.neighborhood = String(customFieldValue)
                                break
                              case 'estado':
                                contactData.state = String(customFieldValue)
                                break
                            }
                          }
                        })
                      }
                      
                      if (onPrimaryContactPrefill) {
                        onPrimaryContactPrefill(contactData)
                      }
                    }
                  }
                } catch (error) {
                  setOpportunityError('Erro ao buscar oportunidade')
                } finally {
                  setIsSearchingOpportunity(false)
                }
              }}
            >
              {isSearchingOpportunity ? (
                <svg
                  className="h-4 w-4 text-neutral-400 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
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
              )}
            </button>
          </div>
          {errors.opportunityId && (
            <p className="text-sm text-red-600 mt-1">{errors.opportunityId}</p>
          )}
          {opportunityError && (
            <p className="text-sm text-red-600 mt-1">{opportunityError}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label htmlFor="proposalName" className="block text-sm font-medium text-neutral-700 mb-2">
            Nome da Proposta *
          </label>
          <Input
            id="proposalName"
            type="text"
            value={formData.proposalName || ''}
            onChange={(e) => handleInputChange('proposalName', e.target.value)}
            placeholder="Digite o nome da proposta"
            className={errors['proposal.proposalName'] ? 'border-red-500' : ''}
          />
          {errors['proposal.proposalName'] && (
            <p className="text-sm text-red-600 mt-1">{errors['proposal.proposalName']}</p>
          )}
        </div>

        <div>
          <label htmlFor="responsible" className="block text-sm font-medium text-neutral-700 mb-2">
            Responsável *
          </label>
          <Input
            id="responsible"
            type="text"
            value={formData.responsible}
            onChange={(e) => handleInputChange('responsible', e.target.value)}
            placeholder="Nome do responsável pela proposta"
            className={errors['proposal.responsible'] ? 'border-red-500' : ''}
          />
          {errors['proposal.responsible'] && (
            <p className="text-sm text-red-600 mt-1">{errors['proposal.responsible']}</p>
          )}
        </div>
      </div>
    </div>
  )
}
