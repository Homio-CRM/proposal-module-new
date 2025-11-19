'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { dataService } from '@/lib/services/dataService'
import { useContactData } from '@/hooks/useContactData'
import { getSupabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  FileText,
  User,
  UserPlus,
  Building,
  CreditCard,
  X,
  CheckCircle
} from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import type { 
  ProposalFormData, 
  ProposalFormStep, 
  PaymentInstallment,
  ProposalData,
  ContactData,
  PropertyData
} from '@/lib/types/proposal'
import ProposalDataStep from './steps/ProposalDataStep'
import PrimaryContactStep from './steps/PrimaryContactStep'
import AdditionalContactStep from './steps/AdditionalContactStep'
import PropertyDataStep from './steps/PropertyDataStep'
import PaymentInstallmentsStep from './steps/PaymentInstallmentsStep'
import SummaryStep from './steps/SummaryStep'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePreferencesContext } from '@/lib/contexts/PreferencesContext'
import { restrictProposalsToCreator, canManageProposals as canManageProposalsPermission } from '@/lib/utils/permissions'

const FORM_STEPS: ProposalFormStep[] = [
  {
    id: 1,
    title: 'Dados da Proposta',
    description: 'Informações básicas da proposta'
  },
  {
    id: 2,
    title: 'Contato Principal',
    description: 'Dados do contato principal'
  },
  {
    id: 3,
    title: 'Contato Adicional',
    description: 'Dados do contato adicional (opcional)',
    isOptional: true
  },
  {
    id: 4,
    title: 'Dados do Imóvel',
    description: 'Informações do imóvel'
  },
  {
    id: 5,
    title: 'Parcelas',
    description: 'Configuração das parcelas'
  },
  {
    id: 6,
    title: 'Resumo',
    description: 'Revisão e publicação da proposta'
  }
]

const STEP_ICONS = {
  1: FileText,
  2: User,
  3: UserPlus,
  4: Building,
  5: CreditCard,
  6: CheckCircle
}

interface ProposalFormProps {
  initialData?: ProposalFormData
  proposalId?: string
}

export default function ProposalForm({ initialData, proposalId }: ProposalFormProps) {
  const { userData, loading } = useUserDataContext()
  const { customFieldIds } = useCustomFieldsContext()
  const { preferences } = usePreferencesContext()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const restrictToCreator = restrictProposalsToCreator(preferences ?? null, userData?.role ?? 'user') && userData?.userId
    ? userData.userId
    : undefined
  const allowManageProposals = canManageProposalsPermission(preferences ?? null, userData?.role ?? 'user')
  const initialProposal: ProposalData = {
    opportunityId: '',
    proposalDate: '',
    proposalName: '',
    responsible: ''
  }
  const initialPrimaryContact: ContactData = {
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
  }
  const initialProperty: PropertyData = {
    development: '',
    unit: '',
    floor: '',
    tower: '',
    reservedUntil: '',
    observations: '',
    shouldReserveUnit: true
  }
  const [formData, setFormData] = useState<ProposalFormData>(
    initialData || {
      proposal: initialProposal,
      primaryContact: initialPrimaryContact,
      property: initialProperty,
      installments: []
    }
  )

  // Funções de validação
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    // Validar dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }

  const validateCEP = (cep: string): boolean => {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.length === 8
  }

  const validateName = (name: string): boolean => {
    const trimmedName = name.trim()
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0)
    return words.length >= 2 && words.every(word => word.length >= 2)
  }

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10
  }

  const validateCPFMinLength = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '')
    return cleanCPF.length === 11
  }

  const validateStep = (stepId: number): Record<string, string> => {
    const errors: Record<string, string> = {}

    switch (stepId) {
      case 1: // Proposal Data
        if (!formData.proposal.opportunityId.trim()) {
          errors['opportunityId'] = 'ID da oportunidade é obrigatório'
        }
        if (!formData.proposal.proposalDate) {
          errors['proposalDate'] = 'Data da proposta é obrigatória'
        }
        if (!formData.proposal.responsible.trim()) {
          errors['proposal.responsible'] = 'Responsável é obrigatório'
        }
        if (!formData.proposal.proposalName?.trim()) {
          errors['proposal.proposalName'] = 'Nome da proposta é obrigatório'
        }
        break

      case 2: // Primary Contact
        if (!formData.primaryContact.name.trim()) {
          errors['primaryContact.name'] = 'Nome é obrigatório'
        } else if (!validateName(formData.primaryContact.name)) {
          errors['primaryContact.name'] = 'Nome deve conter pelo menos duas palavras'
        }
        if (!formData.primaryContact.cpf.trim()) {
          errors['primaryContact.cpf'] = 'CPF é obrigatório'
        } else if (!validateCPFMinLength(formData.primaryContact.cpf)) {
          errors['primaryContact.cpf'] = 'CPF deve ter 11 dígitos'
        } else if (!validateCPF(formData.primaryContact.cpf)) {
          errors['primaryContact.cpf'] = 'CPF inválido - verifique os dígitos'
        }
        if (!formData.primaryContact.rg.trim()) {
          errors['primaryContact.rg'] = 'RG é obrigatório'
        }
        if (!formData.primaryContact.rgIssuer.trim()) {
          errors['primaryContact.rgIssuer'] = 'Órgão emissor do RG é obrigatório'
        }
        if (!formData.primaryContact.nationality) {
          errors['primaryContact.nationality'] = 'Nacionalidade é obrigatória'
        }
        if (!formData.primaryContact.maritalStatus) {
          errors['primaryContact.maritalStatus'] = 'Estado civil é obrigatório'
        }
        if (!formData.primaryContact.email.trim()) {
          errors['primaryContact.email'] = 'E-mail é obrigatório'
        } else if (!validateEmail(formData.primaryContact.email)) {
          errors['primaryContact.email'] = 'E-mail inválido'
        }
        if (!formData.primaryContact.phone.trim()) {
          errors['primaryContact.phone'] = 'Telefone é obrigatório'
        } else if (!validatePhone(formData.primaryContact.phone)) {
          errors['primaryContact.phone'] = 'Telefone deve ter pelo menos 10 dígitos'
        }
        if (!formData.primaryContact.address.trim()) {
          errors['primaryContact.address'] = 'Endereço é obrigatório'
        }
        if (!formData.primaryContact.zipCode.trim()) {
          errors['primaryContact.zipCode'] = 'CEP é obrigatório'
        } else if (!validateCEP(formData.primaryContact.zipCode)) {
          errors['primaryContact.zipCode'] = 'CEP deve ter 8 dígitos'
        }
        if (!formData.primaryContact.city.trim()) {
          errors['primaryContact.city'] = 'Cidade é obrigatória'
        }
        if (!formData.primaryContact.neighborhood.trim()) {
          errors['primaryContact.neighborhood'] = 'Bairro é obrigatório'
        }
        if (!formData.primaryContact.state) {
          errors['primaryContact.state'] = 'Estado é obrigatório'
        }
        break

      case 3: // Additional Contact
        // Sempre tentar validar, mesmo se additionalContact for undefined
        const additionalContact = formData.additionalContact || {
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
        }
        const hasAnyField = !!(
          additionalContact.name?.trim() ||
          additionalContact.cpf?.trim() ||
          additionalContact.rg?.trim() ||
          additionalContact.rgIssuer?.trim() ||
          additionalContact.nationality ||
          additionalContact.maritalStatus ||
          additionalContact.birthDate ||
          additionalContact.email?.trim() ||
          additionalContact.phone?.trim() ||
          additionalContact.address?.trim() ||
          additionalContact.zipCode?.trim() ||
          additionalContact.city?.trim() ||
          additionalContact.neighborhood?.trim() ||
          additionalContact.state ||
          additionalContact.profession?.trim()
        )

        if (hasAnyField) {
            if (!additionalContact.name?.trim()) {
              errors['additionalContact.name'] = 'Nome é obrigatório'
            } else if (!validateName(additionalContact.name)) {
              errors['additionalContact.name'] = 'Nome deve conter pelo menos duas palavras'
            }
            if (!additionalContact.cpf?.trim()) {
              errors['additionalContact.cpf'] = 'CPF é obrigatório'
            } else if (!validateCPFMinLength(additionalContact.cpf)) {
              errors['additionalContact.cpf'] = 'CPF deve ter 11 dígitos'
            } else if (!validateCPF(additionalContact.cpf)) {
              errors['additionalContact.cpf'] = 'CPF inválido - verifique os dígitos'
            }
            if (!additionalContact.rg?.trim()) {
              errors['additionalContact.rg'] = 'RG é obrigatório'
            }
            if (!additionalContact.rgIssuer?.trim()) {
              errors['additionalContact.rgIssuer'] = 'Órgão emissor do RG é obrigatório'
            }
            if (!additionalContact.nationality) {
              errors['additionalContact.nationality'] = 'Nacionalidade é obrigatória'
            }
            if (!additionalContact.maritalStatus) {
              errors['additionalContact.maritalStatus'] = 'Estado civil é obrigatório'
            }
            if (!additionalContact.email?.trim()) {
              errors['additionalContact.email'] = 'E-mail é obrigatório'
            } else if (!validateEmail(additionalContact.email)) {
              errors['additionalContact.email'] = 'E-mail inválido'
            }
            if (!additionalContact.phone?.trim()) {
              errors['additionalContact.phone'] = 'Telefone é obrigatório'
            } else if (!validatePhone(additionalContact.phone)) {
              errors['additionalContact.phone'] = 'Telefone deve ter pelo menos 10 dígitos'
            }
            if (!additionalContact.address?.trim()) {
              errors['additionalContact.address'] = 'Endereço é obrigatório'
            }
            if (!additionalContact.zipCode?.trim()) {
              errors['additionalContact.zipCode'] = 'CEP é obrigatório'
            } else if (!validateCEP(additionalContact.zipCode || '')) {
              errors['additionalContact.zipCode'] = 'CEP deve ter 8 dígitos'
            }
            if (!additionalContact.city?.trim()) {
              errors['additionalContact.city'] = 'Cidade é obrigatória'
            }
            if (!additionalContact.neighborhood?.trim()) {
              errors['additionalContact.neighborhood'] = 'Bairro é obrigatório'
            }
            if (!additionalContact.state) {
              errors['additionalContact.state'] = 'Estado é obrigatório'
            }
            if (!additionalContact.profession?.trim()) {
              errors['additionalContact.profession'] = 'Profissão é obrigatória'
            }
          }
        break

      case 4: // Property Data
        if (!formData.property.development.trim()) {
          errors['property.development'] = 'Empreendimento é obrigatório'
        }
        if (!formData.property.unit.trim()) {
          errors['property.unit'] = 'Unidade é obrigatória'
        }
        if (!formData.property.floor?.trim()) {
          errors['property.floor'] = 'Andar é obrigatório'
        }
        if (!formData.property.tower?.trim()) {
          errors['property.tower'] = 'Torre é obrigatória'
        }
        if (formData.property.shouldReserveUnit !== false && !formData.property.reservedUntil) {
          errors['property.reservedUntil'] = 'Data de reserva é obrigatória'
        }
        break

      case 5: // Payment Installments
        if (formData.installments.length === 0) {
          errors['installments'] = 'Pelo menos uma parcela é obrigatória'
        } else {
          formData.installments.forEach((installment, index) => {
            if (!installment.condition) {
              errors[`installments.${index}.condition`] = 'Condição é obrigatória'
            }
            if (!installment.value || installment.value <= 0) {
              errors[`installments.${index}.value`] = 'Valor deve ser maior que zero'
            }
            if (!installment.quantity || installment.quantity <= 0) {
              errors[`installments.${index}.quantity`] = 'Quantidade deve ser maior que zero'
            }
            if (!installment.date) {
              errors[`installments.${index}.date`] = 'Data é obrigatória'
            }
          })
        }
        break
    }

    return errors
  }

  const isStepValid = useCallback((stepId: number): boolean => {
    switch (stepId) {
      case 1: // Proposal Data
        return !!(
          formData.proposal.opportunityId.trim() &&
          formData.proposal.proposalDate &&
          formData.proposal.responsible.trim() &&
          (formData.proposal.proposalName?.trim() || '')
        )
      
      case 2: // Primary Contact
        const contact = formData.primaryContact
        return !!(
          contact.name.trim() &&
          validateName(contact.name) &&
          contact.cpf.trim() &&
          validateCPFMinLength(contact.cpf) &&
          validateCPF(contact.cpf) &&
          contact.rg.trim() &&
          contact.nationality &&
          contact.maritalStatus &&
          contact.birthDate &&
          contact.email.trim() &&
          validateEmail(contact.email) &&
          contact.phone.trim() &&
          validatePhone(contact.phone) &&
          contact.address.trim() &&
          contact.zipCode.trim() &&
          validateCEP(contact.zipCode) &&
          contact.city.trim() &&
          contact.neighborhood.trim() &&
          contact.state
        )
      
      case 3: // Additional Contact (optional)
        // If no fields are filled, it's valid (optional)
        if (!formData.additionalContact) return true
        
        // If any field is filled, all required fields must be filled
        const additionalContact = formData.additionalContact
        const hasAnyField = !!(
          additionalContact.name.trim() ||
          additionalContact.cpf.trim() ||
          additionalContact.rg.trim() ||
          additionalContact.nationality ||
          additionalContact.maritalStatus ||
          additionalContact.birthDate ||
          additionalContact.email.trim() ||
          additionalContact.phone.trim() ||
          additionalContact.address.trim() ||
          additionalContact.zipCode.trim() ||
          additionalContact.city.trim() ||
          additionalContact.neighborhood.trim() ||
          additionalContact.state
        )
        
        if (!hasAnyField) return true // No fields filled, still valid
        
        // If any field is filled, all required fields must be filled
        return !!(
          additionalContact.name.trim() &&
          validateName(additionalContact.name) &&
          additionalContact.cpf.trim() &&
          validateCPFMinLength(additionalContact.cpf) &&
          validateCPF(additionalContact.cpf) &&
          additionalContact.rg.trim() &&
          additionalContact.nationality &&
          additionalContact.maritalStatus &&
          additionalContact.birthDate &&
          additionalContact.email.trim() &&
          validateEmail(additionalContact.email) &&
          additionalContact.phone.trim() &&
          validatePhone(additionalContact.phone) &&
          additionalContact.address.trim() &&
          additionalContact.zipCode.trim() &&
          validateCEP(additionalContact.zipCode) &&
          additionalContact.city.trim() &&
          additionalContact.neighborhood.trim() &&
          additionalContact.state
        )
      
      case 4: // Property Data
        const property = formData.property
        return !!(
          property.development.trim() &&
          property.unit.trim() &&
          (property.floor?.trim() || '') &&
          (property.tower?.trim() || '') &&
          (property.shouldReserveUnit === false || property.reservedUntil)
        )
      
      case 5: // Payment Installments
        return formData.installments.length > 0 && 
               formData.installments.every(installment => 
                 installment.condition &&
                 installment.value > 0 &&
                 installment.quantity > 0 &&
                 installment.date
               )
      
      case 6: // Summary - valid only if all previous steps are valid
        return isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4) && isStepValid(5)
      
      default:
        return false
    }
  }, [formData])

  const isContactSectionReady = useCallback((): boolean => {
    const primaryComplete = isStepValid(2)
    const additional = formData.additionalContact

    const additionalAny = !!(additional && (
      additional.name.trim() ||
      additional.cpf.trim() ||
      additional.rg.trim() ||
      additional.nationality ||
      additional.maritalStatus ||
      additional.birthDate ||
      additional.email.trim() ||
      additional.phone.trim() ||
      additional.address.trim() ||
      additional.zipCode.trim() ||
      additional.city.trim() ||
      additional.neighborhood.trim() ||
      additional.state
    ))

    const additionalComplete = additionalAny && isStepValid(3)

    // Regra: libera step 4 se (principal completo e adicional vazio) OU (adicional completo)
    return (primaryComplete && !additionalAny) || additionalComplete
  }, [formData.additionalContact, isStepValid])

  const needsPrimaryContactFetch = useMemo(() => {
    return !!(initialData?.primaryContact.homioId && 
      (!initialData.primaryContact.cpf || !initialData.primaryContact.email || !initialData.primaryContact.phone))
  }, [initialData?.primaryContact.homioId, initialData?.primaryContact.cpf, initialData?.primaryContact.email, initialData?.primaryContact.phone])
  
  const needsAdditionalContactFetch = useMemo(() => {
    return !!(initialData?.additionalContact?.homioId && 
      (!initialData.additionalContact.cpf || !initialData.additionalContact.email || !initialData.additionalContact.phone))
  }, [initialData?.additionalContact?.homioId, initialData?.additionalContact?.cpf, initialData?.additionalContact?.email, initialData?.additionalContact?.phone])

  const primaryContactFromCache = useContactData(
    initialData?.primaryContact.homioId || null,
    userData?.activeLocation || null,
    needsPrimaryContactFetch
  )

  const additionalContactFromCache = useContactData(
    initialData?.additionalContact?.homioId || null,
    userData?.activeLocation || null,
    needsAdditionalContactFetch
  )

  useEffect(() => {
    if (initialData) {
      const updatedData = { ...initialData }

      if (primaryContactFromCache.contactData && initialData.primaryContact.homioId) {
        const hasEmptyFields = !initialData.primaryContact.cpf || 
          !initialData.primaryContact.email || 
          !initialData.primaryContact.phone
        
        if (hasEmptyFields) {
          updatedData.primaryContact = {
            ...primaryContactFromCache.contactData,
            homioId: initialData.primaryContact.homioId
          }
        }
      }

      if (additionalContactFromCache.contactData && initialData.additionalContact?.homioId) {
        const hasEmptyFields = !initialData.additionalContact.cpf || 
          !initialData.additionalContact.email || 
          !initialData.additionalContact.phone
        
        if (hasEmptyFields) {
          updatedData.additionalContact = {
            ...additionalContactFromCache.contactData,
            homioId: initialData.additionalContact.homioId
          }
        }
      }

      setFormData(updatedData)
    }
  }, [initialData, primaryContactFromCache.contactData, additionalContactFromCache.contactData])




  const canProceedToStep = (stepId: number): boolean => {
    if (stepId === 1) return true
    
    // Validação sequencial rigorosa: todos os steps anteriores devem estar válidos
    for (let i = 1; i < stepId; i++) {
      // Step 3 (Additional Contact) é opcional, mas se houver dados, deve ser válido
      if (i === 3) {
        // Se há dados no contato adicional, deve estar válido
        if (formData.additionalContact) {
          const hasAnyField = !!(
            formData.additionalContact.name.trim() ||
            formData.additionalContact.cpf.trim() ||
            formData.additionalContact.rg.trim() ||
            formData.additionalContact.nationality ||
            formData.additionalContact.maritalStatus ||
            formData.additionalContact.birthDate ||
            formData.additionalContact.email.trim() ||
            formData.additionalContact.phone.trim() ||
            formData.additionalContact.address.trim() ||
            formData.additionalContact.zipCode.trim() ||
            formData.additionalContact.city.trim() ||
            formData.additionalContact.neighborhood.trim() ||
            formData.additionalContact.state
          )
          
          if (hasAnyField && !isStepValid(3)) {
            return false
          }
        }
        continue // Step 3 é opcional se não há dados
      }
      
      // Para todos os outros steps, verificar se estão válidos
      if (!isStepValid(i)) {
        return false
      }
    }
    
    // Para step 4, aplicar regra especial de readiness dos contatos
    if (stepId === 4) {
      return isContactSectionReady()
    }
    
    return true
  }

  const isStepAccessible = (stepId: number): boolean => {
    if (stepId === 1) return true
    if (stepId === currentStep) return true // Current step is always clickable
    
    // Always allow going back to previous steps
    if (stepId < currentStep) return true
    
    // For steps after current step, use the same logic as canProceedToStep
    return canProceedToStep(stepId)
  }

  const handleStepClick = (stepId: number) => {
    if (canProceedToStep(stepId)) {
      setCurrentStep(stepId)
    }
  }

  const handleNext = () => {
    // Validar o step atual
    const errors = validateStep(currentStep)
    setValidationErrors(errors)
    
    // Se não há erros, prosseguir para o próximo step
    if (Object.keys(errors).length === 0) {
      if (currentStep < FORM_STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClearCurrentStep = () => {
    setValidationErrors({})
    setFormData(prev => {
      switch (currentStep) {
        case 1:
          return { ...prev, proposal: { ...initialProposal } }
        case 2:
          return { ...prev, primaryContact: { ...initialPrimaryContact } }
        case 3:
          return { ...prev, additionalContact: undefined }
        case 4:
          return { ...prev, property: { ...initialProperty } }
        case 5:
          return { ...prev, installments: [] }
        default:
          return prev
      }
    })
  }

  const handleStepDataChange = (stepId: number, data: ProposalData | ContactData | PropertyData | PaymentInstallment[] | undefined) => {
    // Limpar erros quando o usuário começar a digitar
    setValidationErrors({})
    
    setFormData(prev => {
      switch (stepId) {
        case 1:
          return { ...prev, proposal: data as ProposalData }
        case 2:
          return { ...prev, primaryContact: data as ContactData }
        case 3:
          return { ...prev, additionalContact: data as ContactData }
        case 4:
          return { ...prev, property: data as PropertyData }
        case 5:
          return { ...prev, installments: data as PaymentInstallment[] }
        default:
          return prev
      }
    })
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverDetails, setServerDetails] = useState<Record<string, unknown> | null>(null)
  const [isSearchingOpportunity, setIsSearchingOpportunity] = useState(false)

  const handlePublishProposal = async () => {
    if (!userData) return

    setValidationErrors({})

    try {
      // Buscar configuração da agência para obter os IDs dos custom fields
      const agencyConfig = await dataService.fetchAgencyConfig(userData.activeLocation)
      
      // Preparar dados dos contatos para update
      const prepareContactData = (contact: ContactData & { customFields?: Array<{ id: string; value?: string; fieldValueString?: string; fieldValueLabel?: string; fieldValueFormatted?: string }> }) => {
        const customFields = contact.customFields ? contact.customFields.map((field) => ({
          id: field.id,
          field_value: field.value || field.fieldValueString || field.fieldValueLabel || field.fieldValueFormatted || ''
        })) : []

        // Adicionar custom fields de empreendimento, unidade, andar e torre
        if (formData.property && agencyConfig) {
          // Adicionar empreendimento
          if (agencyConfig.contact_building && formData.property.development) {
            customFields.push({
              id: agencyConfig.contact_building,
              field_value: formData.property.development
            })
          }
          
          // Adicionar unidade
          if (agencyConfig.contact_unit && formData.property.unit) {
            customFields.push({
              id: agencyConfig.contact_unit,
              field_value: formData.property.unit
            })
          }
          
          // Adicionar andar
          if (agencyConfig.contact_floor && formData.property.floor) {
            customFields.push({
              id: agencyConfig.contact_floor,
              field_value: formData.property.floor
            })
          }
          
          // Adicionar torre
          if (agencyConfig.contact_tower && formData.property.tower) {
            customFields.push({
              id: agencyConfig.contact_tower,
              field_value: formData.property.tower
            })
          }
        }

        return {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          dateOfBirth: contact.birthDate,
          customFields
        }
      }

      // Atualizar contato principal
      const primaryContactData = prepareContactData(formData.primaryContact)
      
      const primaryContactRes = await fetch('/api/operations/contact/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: userData.activeLocation,
          contactId: formData.primaryContact.homioId || 'new-contact',
          ...primaryContactData
        })
      })

      if (!primaryContactRes.ok) {
        const errorData = await primaryContactRes.json().catch(() => null)
        console.error('[ProposalForm] Primary contact update failed:', errorData)
        setServerError('Falha ao atualizar contato principal')
        setServerDetails(errorData)
        setShowErrorModal(true)
        return
      }

      // Atualizar contato adicional se existir
      if (formData.additionalContact && formData.additionalContact.name) {
        const additionalContactData = prepareContactData(formData.additionalContact)
        
        const additionalContactRes = await fetch('/api/operations/contact/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId: userData.activeLocation,
            contactId: formData.additionalContact.homioId || 'new-contact',
            ...additionalContactData
          })
        })

        if (!additionalContactRes.ok) {
          const errorData = await additionalContactRes.json().catch(() => null)
          console.error('[ProposalForm] Additional contact update failed:', errorData)
          setServerError('Falha ao atualizar contato adicional')
          setServerDetails(errorData)
          setShowErrorModal(true)
          return
        }
      }

      const opportunityFieldValueMap: Record<string, string | undefined> = {
        responsavel: formData.proposal.responsible ? formData.proposal.responsible.trim() : undefined,
        empreendimento: formData.property.development ? formData.property.development.trim() : undefined,
        unidade: formData.property.unit ? formData.property.unit.trim() : undefined,
        andar: formData.property.floor ? formData.property.floor.trim() : undefined,
        torre: formData.property.tower ? formData.property.tower.trim() : undefined,
        observacoes: formData.property.observations ? formData.property.observations.trim() : undefined
      }

      if (formData.property.shouldReserveUnit !== false && formData.property.reservedUntil) {
        opportunityFieldValueMap.reserve_until = formData.property.reservedUntil
      }

      const opportunityCustomFields: Array<{ id: string; field_value: string }> = []

      Object.entries(customFieldIds.opportunityFields).forEach(([fieldKey, fieldId]) => {
        const value = opportunityFieldValueMap[fieldKey]
        if (typeof value === 'string' && value.trim() !== '') {
          opportunityCustomFields.push({ id: fieldId, field_value: value })
        }
      })

      if (opportunityCustomFields.length > 0) {
        const opportunityUpdateRes = await fetch('/api/operations/opportunity/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            locationId: userData.activeLocation
          },
          body: JSON.stringify({
            opportunityId: formData.proposal.opportunityId,
            customFields: opportunityCustomFields
          })
        })

        if (!opportunityUpdateRes.ok) {
          const errorData = await opportunityUpdateRes.json().catch(() => null)
          setServerError('Falha ao atualizar oportunidade')
          setServerDetails(errorData)
          setShowErrorModal(true)
          return
        }
      }

      // Preparar payload da proposta
      const payload = {
        agencyId: userData.activeLocation,
        opportunityId: formData.proposal.opportunityId,
        proposalDate: formData.proposal.proposalDate,
        proposalName: formData.proposal.proposalName || '',
        responsible: formData.proposal.responsible,
        reservedUntil: formData.property.shouldReserveUnit !== false ? formData.property.reservedUntil : undefined,
        shouldReserveUnit: formData.property.shouldReserveUnit !== false,
        unit: {
          number: formData.property.unit,
          tower: formData.property.tower,
          floor: formData.property.floor
        },
        unitId: formData.property.unitId,
        primaryContact: {
          homioId: formData.primaryContact.homioId,
          name: formData.primaryContact.name
        },
        secondaryContact: formData.additionalContact && formData.additionalContact.name ? {
          homioId: formData.additionalContact.homioId,
          name: formData.additionalContact.name
        } : null,
        installments: (formData.installments || []).map(i => ({
          type: i.condition,
          amountPerInstallment: i.value,
          installmentsCount: i.quantity,
          totalAmount: i.value * i.quantity,
          startDate: i.date
        }))
      }

      const url = proposalId ? `/api/proposals/${proposalId}` : '/api/proposals'
      const method = proposalId ? 'PUT' : 'POST'
      
      const supabaseClient = await getSupabase()
      const { data: { session } } = await supabaseClient.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setServerError(typeof (data as Record<string, unknown>)?.error === 'string' ? (data as Record<string, unknown>).error as string : 'Erro ao salvar')
        setServerDetails((data as Record<string, unknown>) ?? null)
        setShowErrorModal(true)
        return
      }
      if (userData?.companyId) {
        dataService.clearProposalsCache(
          userData.companyId,
          restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
        )
      }
      setShowSuccessModal(true)
    } catch {
      setServerError('Falha de rede')
      setServerDetails(null)
      setShowErrorModal(true)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProposalDataStep
            data={formData.proposal}
            onDataChange={(data) => handleStepDataChange(1, data)}
            errors={validationErrors}
            onPrimaryContactPrefill={(contactData) => {
              setFormData(prev => ({
                ...prev,
                primaryContact: {
                  ...prev.primaryContact,
                  ...contactData,
                }
              }))
            }}
            onAdditionalContactPrefill={(contactData) => {
              setFormData(prev => ({
                ...prev,
                additionalContact: {
                  ...(prev.additionalContact || {
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
                  }),
                  ...contactData,
                }
              }))
            }}
            onPropertyPrefill={(propertyData) => {
              
              const updatedProperty = {
                ...formData.property,
                ...propertyData,
                buildingId: propertyData.buildingId,
                unitId: propertyData.unitId,
              }
              
              
              setFormData(prev => {
                const newFormData = {
                  ...prev,
                  property: updatedProperty,
                }
                return newFormData
              })
            }}
            onLoadingChange={setIsSearchingOpportunity}
          />
        )
      case 2:
        return (
          <PrimaryContactStep
            data={formData.primaryContact}
            onDataChange={(data) => handleStepDataChange(2, data)}
            errors={validationErrors}
          />
        )
      case 3:
        return (
          <AdditionalContactStep
            data={formData.additionalContact}
            onDataChange={(data) => handleStepDataChange(3, data)}
            errors={validationErrors}
          />
        )
      case 4:
        return (
          <PropertyDataStep
            data={formData.property}
            onDataChange={(data) => handleStepDataChange(4, data)}
            errors={validationErrors}
          />
        )
      case 5:
        return (
          <PaymentInstallmentsStep
            data={formData.installments}
            onDataChange={(data) => handleStepDataChange(5, data)}
            errors={validationErrors}
          />
        )
      case 6:
        return (
          <>
            <SummaryStep
              data={formData}
              onPublish={handlePublishProposal}
            />
            <Dialog open={showSuccessModal} onOpenChange={(open) => {
              if (!open) {
                setShowSuccessModal(false)
                if (proposalId) {
                  router.push(`/proposals/${proposalId}`)
                } else {
                  router.push('/proposals')
                }
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{proposalId ? 'Proposta atualizada' : 'Proposta criada'}</DialogTitle>
                  <DialogDescription>{proposalId ? 'A proposta foi atualizada com sucesso.' : 'A proposta foi salva com sucesso.'}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setShowSuccessModal(false)
                    if (proposalId) {
                      router.push(`/proposals/${proposalId}`)
                    } else {
                      router.push('/proposals')
                    }
                  }}>OK</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showErrorModal} onOpenChange={(open) => setShowErrorModal(open)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Falha ao salvar</DialogTitle>
                  <DialogDescription>{serverError || 'Ocorreu um erro ao salvar a proposta.'}</DialogDescription>
                </DialogHeader>
                {serverDetails && (
                  <div className="bg-neutral-50 p-3 rounded text-xs text-neutral-700 overflow-auto max-h-48">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(serverDetails, null, 2)}</pre>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowErrorModal(false)}>Fechar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )
      default:
        return (
          <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-neutral-500">
              Conteúdo do passo {currentStep} será implementado
            </p>
          </div>
        )
    }
  }


  const isCustomFieldsLoaded = Object.keys(customFieldIds.opportunityFields).length > 0 || 
                               Object.keys(customFieldIds.contactFields).length > 0

  if (loading || !userData || !isCustomFieldsLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block w-96 bg-white border-r border-neutral-200 p-6">
              <div className="sticky top-4">
                <div className="mb-8">
                  <div className="mb-6">
                    <Skeleton className="h-8 w-48" />
                  </div>
                  <Skeleton className="h-8 w-64 mb-6" />
                </div>

                {/* Navigation Box Skeleton */}
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                {/* Mobile Progress Indicator Skeleton */}
                <div className="lg:hidden mb-6 p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="w-full h-2 rounded-full" />
                </div>

                {/* Card Container Skeleton */}
                <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>

                  {/* Form Content Skeleton */}
                  <div className="p-6 min-h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons Skeleton */}
                  <div className="flex justify-between items-center p-6 border-t border-neutral-200 bg-neutral-50">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData || !allowManageProposals) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-accent-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Acesso Negado
              </h2>
              <p className="text-neutral-600">
                Apenas usuários administradores podem acessar este formulário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden lg:block w-96 bg-white border-r border-neutral-200 p-6">
            <div className="sticky top-4">
              <div className="mb-8">
                <div className="mb-6">
                  <BackButton href="/proposals">
                    Voltar para Propostas
                  </BackButton>
                </div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Formulário de Proposta
                </h1>
              </div>

              {/* Navigation Box */}
              <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                <div className="space-y-1">
                  {FORM_STEPS.map((step, index) => {
                    const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS]
                    const isActive = currentStep === step.id
                    const isAccessible = isStepAccessible(step.id)
                    
                    return (
                      <div key={step.id} className="relative">
                        {/* Connecting Line */}
                        {index < FORM_STEPS.length - 1 && (
                          <div className="absolute left-7.5 top-14 w-px h-6 bg-neutral-300" />
                        )}
                        
                        <button
                          onClick={() => handleStepClick(step.id)}
                          disabled={!isAccessible}
                          className={`w-full flex items-center space-x-4 py-3 px-3 rounded-lg transition-all duration-200 ${
                            isAccessible 
                              ? 'cursor-pointer hover:bg-white hover:shadow-sm' 
                              : 'cursor-not-allowed opacity-50'
                          } ${
                            isActive ? 'bg-white shadow-sm border border-neutral-200' : ''
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isActive ? (
                              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                            ) : step.id < currentStep ? (
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-neutral-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className={`text-sm font-semibold ${
                              isActive ? 'text-neutral-900' : 
                              step.id < currentStep ? 'text-neutral-900' : 
                              'text-neutral-600'
                            }`}>
                              {step.title}
                            </h3>
                            <p className={`text-xs mt-0.5 ${
                              isActive ? 'text-neutral-700' : 
                              step.id < currentStep ? 'text-neutral-600' : 
                              'text-neutral-500'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Mobile Progress Indicator */}
              <div className="lg:hidden mb-6 p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-600">
                    Etapa {currentStep} de {FORM_STEPS.length}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {FORM_STEPS[currentStep - 1]?.title}
                  </span>
                </div>
                <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / FORM_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Card Container */}
              <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">
                      {FORM_STEPS[currentStep - 1]?.title}
                    </h2>
                    <p className="text-neutral-600 mt-1">
                      {FORM_STEPS[currentStep - 1]?.description}
                    </p>
                  </div>
                  <button onClick={handleClearCurrentStep} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                {/* Form Content */}
                <div className="p-6 min-h-[600px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                {currentStep !== 6 && (
                  <div className="flex justify-between items-center p-6 border-t border-neutral-200 bg-neutral-50">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className={`flex items-center space-x-2 ${
                        currentStep === 1 
                          ? 'border-neutral-200 text-neutral-400 cursor-not-allowed' 
                          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <span>Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal para busca de oportunidade */}
      <Dialog open={isSearchingOpportunity} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <DialogTitle className="text-lg font-semibold text-center">
              Pesquisando Oportunidade
            </DialogTitle>
            <DialogDescription className="text-center text-neutral-600 mt-2">
              Aguarde enquanto buscamos e preenchemos os dados da oportunidade...
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
