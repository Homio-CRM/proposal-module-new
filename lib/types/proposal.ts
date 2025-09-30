export interface ProposalData {
  opportunityId: string
  proposalDate: string
  proposalName?: string
  responsible: string
  proposalType?: string
  proposalStatus?: string
  priority?: string
  source?: string
  externalReference?: string
  validUntil?: string
  assignedAgent?: string
}

export interface ContactData {
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
  postalCode?: string
  city: string
  neighborhood: string
  state: string
  profession?: string
}

export interface PropertyData {
  development: string
  unit: string
  floor: string
  tower: string
  reservedUntil: string
  observations: string
}

export type PaymentCondition = 'sinal' | 'mensal' | 'semestral'

export interface PaymentInstallment {
  id: string
  condition: PaymentCondition
  value: number
  quantity: number
  date: string
}

export interface ProposalFormData {
  proposal: ProposalData
  primaryContact: ContactData
  additionalContact?: ContactData
  property: PropertyData
  installments: PaymentInstallment[]
}

export interface ProposalFormStep {
  id: number
  title: string
  description: string
  isOptional?: boolean
}

export type ProposalStatus = 'em_analise' | 'aprovada' | 'negada'

export interface ProposalListItem {
  id: string
  title: string
  primaryContactName: string
  development: string
  unit: string
  status: ProposalStatus
  proposalDate: string
  price?: number
  assignedAgent?: string
}

export interface ProposalFilters {
  search: string
  development: string
  unit: string
  status: ProposalStatus | 'all'
}