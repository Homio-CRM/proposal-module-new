import { useState, useEffect, useMemo, useRef } from 'react'
import { dataService } from '@/lib/services/dataService'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'

interface ContactData {
  name: string
  cpf: string
  rg: string
  rgIssuer: string
  nationality: string
  maritalStatus: string
  birthDate: string
  email: string
  phone: string
  address: string
  zipCode: string
  city: string
  neighborhood: string
  state: string
  profession?: string
  homioId?: string
}

const contactCache = new Map<string, { data: ContactData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000
const loadingPromises = new Map<string, Promise<ContactData>>()

export function clearContactCache(contactId?: string | null, locationId?: string | null): void {
  if (contactId && locationId) {
    const cacheKey = `${contactId}:${locationId}`
    contactCache.delete(cacheKey)
    loadingPromises.delete(cacheKey)
  } else {
    contactCache.clear()
    loadingPromises.clear()
  }
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

function extractCustomFieldString(field: Record<string, unknown>): string | null {
  const dateValue = field.fieldValueDate ?? field.fieldValue
  if (dateValue !== undefined && dateValue !== null) {
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } else if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]
    } else if (typeof dateValue === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(dateValue) || /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const [d, m, y] = dateValue.split('/')
        return `${y}-${m}-${d}`
      }
      return dateValue
    }
  }
  
  const v = field.value ?? field.fieldValueString ?? field.fieldValueLabel ?? field.fieldValueFormatted
  if (v === undefined || v === null) return null
  if (v instanceof Date) return v.toISOString().split('T')[0]
  const str = String(v)
  if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/')
    return `${y}-${m}-${d}`
  }
  return str
}

interface UseContactDataResult {
  contactData: ContactData | null
  loading: boolean
  error: string | null
}

export function useContactData(
  contactId: string | null, 
  locationId: string | null,
  forceRefresh?: boolean
): UseContactDataResult {
  const [contactData, setContactData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { customFieldIds } = useCustomFieldsContext()
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const contactFieldsKeys = useMemo(() => 
    JSON.stringify(Object.keys(customFieldIds.contactFields).sort()), 
    [customFieldIds.contactFields]
  )

  useEffect(() => {
    if (!contactId || !locationId) {
      setContactData(null)
      setLoading(false)
      setError(null)
      return
    }

    const cacheKey = `${contactId}:${locationId}`
    
    if (forceRefresh) {
      contactCache.delete(cacheKey)
      loadingPromises.delete(cacheKey)
    }
    
    const cached = contactCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !forceRefresh) {
      setContactData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    if (loadingPromises.has(cacheKey)) {
      setLoading(true)
      loadingPromises.get(cacheKey)!.then(data => {
        setContactData(data)
        setLoading(false)
        setError(null)
      }).catch(err => {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setContactData(null)
        setLoading(false)
      })
      return
    }

    const loadContactData = async (): Promise<ContactData> => {
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/operations/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, locationId }),
          signal
        })
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do contato')
        }

        const data = await response.json()
        const contact = data?.contact ?? data
        
        if (!contact) {
          throw new Error('Contato não encontrado')
        }

        const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        const rawName = contact?.fullNameLowerCase || [contact?.firstName, contact?.lastName].filter(Boolean).join(' ')
        
        const processedContact: ContactData = {
          name: rawName ? toTitleCase(rawName) : '',
          email: contact?.email || contact?.emailLowerCase || '',
          phone: contact?.phone || '',
          zipCode: contact?.postalCode || '',
          city: contact?.city || '',
          address: contact?.address1 || '',
          state: contact?.state || '',
          cpf: '',
          rg: '',
          rgIssuer: '',
          nationality: '',
          maritalStatus: '',
          birthDate: '',
          neighborhood: ''
        }

        if (contact?.dateOfBirth) {
          const birthDate = contact.dateOfBirth
          if (typeof birthDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(birthDate)) {
            processedContact.birthDate = birthDate.slice(0, 10)
          }
        }

        const contactFieldMappings: { contactFields: Array<{ formField: string; customFieldId: string; customFieldName: string }> } = {
          contactFields: Object.entries(customFieldIds.contactFields).map(([field, customFieldId]) => ({
            formField: field,
            customFieldId: customFieldId,
            customFieldName: field
          }))
        }

        if (contact.customFields && Array.isArray(contact.customFields)) {
          const contactCustomFields: Record<string, string> = {}
          contact.customFields.forEach((field: Record<string, unknown>) => {
            const id = String(field.id ?? '')
            if (!id) return
            const str = extractCustomFieldString(field)
            if (str !== null) {
              contactCustomFields[id] = str
            }
          })

          contactFieldMappings.contactFields.forEach(mapping => {
            const customFieldValue = contactCustomFields[mapping.customFieldId]
            if (customFieldValue !== undefined && customFieldValue !== null) {
              switch (mapping.formField) {
                case 'cpf':
                  processedContact.cpf = String(customFieldValue)
                  break
                case 'rg':
                  processedContact.rg = String(customFieldValue)
                  break
                case 'orgaoEmissor':
                case 'rg__orgao_emissor':
                  processedContact.rgIssuer = String(customFieldValue)
                  break
                case 'nacionalidade':
                  processedContact.nationality = String(customFieldValue)
                  break
                case 'estadoCivil':
                case 'estado_civil':
                  const normalized = normalizeMaritalStatus(customFieldValue)
                  processedContact.maritalStatus = normalized
                  break
                case 'profissao':
                  processedContact.profession = String(customFieldValue)
                  break
                case 'cep':
                  processedContact.zipCode = String(customFieldValue)
                  break
                case 'endereco':
                  processedContact.address = String(customFieldValue)
                  break
                case 'cidade':
                  processedContact.city = String(customFieldValue)
                  break
                case 'bairro':
                  processedContact.neighborhood = String(customFieldValue)
                  break
                case 'estado':
                  processedContact.state = String(customFieldValue)
                  break
              }
            }
          })
        }

        contactCache.set(cacheKey, { data: processedContact, timestamp: Date.now() })
        loadingPromises.delete(cacheKey)
        setContactData(processedContact)
        return processedContact
      } catch (err) {
        loadingPromises.delete(cacheKey)
        if (err instanceof Error && err.name === 'AbortError') {
          throw err
        }
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        setContactData(null)
        throw err
      } finally {
        setLoading(false)
      }
    }

    const promise = loadContactData()
    loadingPromises.set(cacheKey, promise)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [contactId, locationId, contactFieldsKeys, forceRefresh])

  return { contactData, loading, error }
}
