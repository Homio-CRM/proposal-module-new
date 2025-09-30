'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
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

export default function ProposalForm() {
  const { userData, loading } = useUserDataContext()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
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
    observations: ''
  }
  const [formData, setFormData] = useState<ProposalFormData>({
    proposal: initialProposal,
    primaryContact: initialPrimaryContact,
    property: initialProperty,
    installments: []
  })

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
        }
        if (!formData.primaryContact.cpf.trim()) {
          errors['primaryContact.cpf'] = 'CPF é obrigatório'
        } else if (!validateCPF(formData.primaryContact.cpf)) {
          errors['primaryContact.cpf'] = 'CPF inválido'
        }
        if (!formData.primaryContact.rg.trim()) {
          errors['primaryContact.rg'] = 'RG é obrigatório'
        }
        if (!formData.primaryContact.nationality) {
          errors['primaryContact.nationality'] = 'Nacionalidade é obrigatória'
        }
        if (!formData.primaryContact.maritalStatus) {
          errors['primaryContact.maritalStatus'] = 'Estado civil é obrigatório'
        }
        if (!formData.primaryContact.birthDate) {
          errors['primaryContact.birthDate'] = 'Data de nascimento é obrigatória'
        }
        if (!formData.primaryContact.email.trim()) {
          errors['primaryContact.email'] = 'E-mail é obrigatório'
        } else if (!validateEmail(formData.primaryContact.email)) {
          errors['primaryContact.email'] = 'E-mail inválido'
        }
        if (!formData.primaryContact.phone.trim()) {
          errors['primaryContact.phone'] = 'Telefone é obrigatório'
        }
        if (!formData.primaryContact.address.trim()) {
          errors['primaryContact.address'] = 'Endereço é obrigatório'
        }
        if (!formData.primaryContact.zipCode.trim()) {
          errors['primaryContact.zipCode'] = 'CEP é obrigatório'
        } else if (!validateCEP(formData.primaryContact.zipCode)) {
          errors['primaryContact.zipCode'] = 'CEP inválido'
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

          if (hasAnyField) {
            if (!formData.additionalContact.name.trim()) {
              errors['additionalContact.name'] = 'Nome é obrigatório'
            }
            if (!formData.additionalContact.cpf.trim()) {
              errors['additionalContact.cpf'] = 'CPF é obrigatório'
            } else if (!validateCPF(formData.additionalContact.cpf)) {
              errors['additionalContact.cpf'] = 'CPF inválido'
            }
            if (!formData.additionalContact.rg.trim()) {
              errors['additionalContact.rg'] = 'RG é obrigatório'
            }
            if (!formData.additionalContact.nationality) {
              errors['additionalContact.nationality'] = 'Nacionalidade é obrigatória'
            }
            if (!formData.additionalContact.maritalStatus) {
              errors['additionalContact.maritalStatus'] = 'Estado civil é obrigatório'
            }
            if (!formData.additionalContact.birthDate) {
              errors['additionalContact.birthDate'] = 'Data de nascimento é obrigatória'
            }
            if (!formData.additionalContact.email.trim()) {
              errors['additionalContact.email'] = 'E-mail é obrigatório'
            } else if (!validateEmail(formData.additionalContact.email)) {
              errors['additionalContact.email'] = 'E-mail inválido'
            }
            if (!formData.additionalContact.phone.trim()) {
              errors['additionalContact.phone'] = 'Telefone é obrigatório'
            }
            if (!formData.additionalContact.address.trim()) {
              errors['additionalContact.address'] = 'Endereço é obrigatório'
            }
            if (!formData.additionalContact.zipCode.trim()) {
              errors['additionalContact.zipCode'] = 'CEP é obrigatório'
            } else if (!validateCEP(formData.additionalContact.zipCode)) {
              errors['additionalContact.zipCode'] = 'CEP inválido'
            }
            if (!formData.additionalContact.city.trim()) {
              errors['additionalContact.city'] = 'Cidade é obrigatória'
            }
            if (!formData.additionalContact.neighborhood.trim()) {
              errors['additionalContact.neighborhood'] = 'Bairro é obrigatório'
            }
            if (!formData.additionalContact.state) {
              errors['additionalContact.state'] = 'Estado é obrigatório'
            }
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
        if (!formData.property.floor.trim()) {
          errors['property.floor'] = 'Andar é obrigatório'
        }
        if (!formData.property.tower.trim()) {
          errors['property.tower'] = 'Torre é obrigatória'
        }
        if (!formData.property.reservedUntil) {
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
          contact.cpf.trim() &&
          contact.rg.trim() &&
          contact.nationality &&
          contact.maritalStatus &&
          contact.birthDate &&
          contact.email.trim() &&
          contact.phone.trim() &&
          contact.address.trim() &&
          contact.zipCode.trim() &&
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
          additionalContact.cpf.trim() &&
          additionalContact.rg.trim() &&
          additionalContact.nationality &&
          additionalContact.maritalStatus &&
          additionalContact.birthDate &&
          additionalContact.email.trim() &&
          additionalContact.phone.trim() &&
          additionalContact.address.trim() &&
          additionalContact.zipCode.trim() &&
          additionalContact.city.trim() &&
          additionalContact.neighborhood.trim() &&
          additionalContact.state
        )
      
      case 4: // Property Data
        const property = formData.property
        return !!(
          property.development.trim() &&
          property.unit.trim() &&
          property.floor.trim() &&
          property.tower.trim() &&
          property.reservedUntil
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

  useEffect(() => {
    if (userData && userData.role !== 'admin') {
      setCurrentStep(0)
    }
  }, [userData])




  const canProceedToStep = (stepId: number): boolean => {
    if (stepId === 1) return true
    
    // For step 3 (Additional Contact), check if step 2 is valid
    if (stepId === 3) return isStepValid(2)
    
    // For other steps, check if previous step is valid
    if (stepId > 1) return isStepValid(stepId - 1)
    
    return false
  }

  const isStepAccessible = (stepId: number): boolean => {
    if (stepId === 1) return true
    if (stepId === currentStep) return true // Current step is always clickable
    
    // Always allow going back to previous steps
    if (stepId < currentStep) return true
    
    // For steps after current step
    if (stepId > currentStep) {
      // Special case for Step 3 (Additional Contact) - needs Step 2 to be valid
      if (stepId === 3) return isStepValid(2)
      
      // Check if this step was previously valid
      if (isStepValid(stepId)) return true
      
      // Check if we can access the immediate next step
      if (stepId === currentStep + 1) {
        if (currentStep === 1) return isStepValid(1)
        if (currentStep === 2) return isStepValid(2)
        if (currentStep === 3) return isStepValid(3) // Step 3 is optional, so it's always valid
        if (currentStep === 4) return isStepValid(4)
        if (currentStep === 5) return isStepValid(5)
      }
      
      // Check if all previous steps are valid (for accessing any future step)
      let allPreviousValid = true
      for (let i = 1; i < stepId; i++) {
        if (i === 3) continue // Step 3 is optional, skip validation
        if (!isStepValid(i)) {
          allPreviousValid = false
          break
        }
      }
      if (allPreviousValid) return true
      
      return false
    }
    
    return false
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


  const handlePublishProposal = async () => {
    try {
      console.log('Publishing proposal:', formData)
      // TODO: Implement actual API call to publish proposal
      alert('Proposta publicada com sucesso!')
    } catch (error) {
      console.error('Error publishing proposal:', error)
      alert('Erro ao publicar proposta. Tente novamente.')
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
              console.log('🔧 ProposalForm recebeu dados do contato:', contactData)
              setFormData(prev => ({
                ...prev,
                primaryContact: {
                  ...prev.primaryContact,
                  ...contactData,
                }
              }))
            }}
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
          <SummaryStep
            data={formData}
            onPublish={handlePublishProposal}
          />
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


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!userData || userData.role !== 'admin') {
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
    </div>
  )
}
