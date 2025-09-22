'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalFormData, PaymentCondition } from '@/lib/types/proposal'
import { 
  FileText, 
  User, 
  UserPlus, 
  Building, 
  CreditCard,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'

interface ProposalDetailsProps {
  data: ProposalFormData
}

export function ProposalDetails({ data }: ProposalDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getPaymentConditionLabel = (condition: PaymentCondition) => {
    switch (condition) {
      case 'sinal':
        return 'Sinal'
      case 'mensal':
        return 'Mensal'
      case 'semestral':
        return 'Semestral'
      default:
        return condition
    }
  }

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'Em Análise':
        return 'warning'
      case 'Aprovada':
        return 'success'
      case 'Negada':
        return 'destructive'
      default:
        return 'outline'
    }
  }


  return (
    <div className="space-y-6">
      {/* Dados da Proposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Dados da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ID da Oportunidade</label>
              <p className="text-sm text-gray-900">{data.proposal.opportunityId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data da Proposta</label>
              <p className="text-sm text-gray-900">{formatDate(data.proposal.proposalDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(data.proposal.proposalStatus)}>
                  {data.proposal.proposalStatus || 'N/A'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Responsável</label>
              <p className="text-sm text-gray-900">{data.property.responsible}</p>
            </div>
            {data.property.observations && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <p className="text-sm text-gray-900">{data.property.observations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Contato Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="text-sm text-gray-900">{data.primaryContact.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CPF</label>
              <p className="text-sm text-gray-900">{data.primaryContact.cpf}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">RG</label>
              <p className="text-sm text-gray-900">{data.primaryContact.rg}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nacionalidade</label>
              <p className="text-sm text-gray-900">{data.primaryContact.nationality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estado Civil</label>
              <p className="text-sm text-gray-900">{data.primaryContact.maritalStatus}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
              <p className="text-sm text-gray-900">{formatDate(data.primaryContact.birthDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <p className="text-sm text-gray-900">{data.primaryContact.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <p className="text-sm text-gray-900">{data.primaryContact.phone}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Endereço</label>
              <p className="text-sm text-gray-900">{data.primaryContact.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CEP</label>
              <p className="text-sm text-gray-900">{data.primaryContact.zipCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cidade</label>
              <p className="text-sm text-gray-900">{data.primaryContact.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bairro</label>
              <p className="text-sm text-gray-900">{data.primaryContact.neighborhood}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <p className="text-sm text-gray-900">{data.primaryContact.state}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato Adicional */}
      {data.additionalContact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary-600" />
              Contato Adicional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-sm text-gray-900">{data.additionalContact.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CPF</label>
                <p className="text-sm text-gray-900">{data.additionalContact.cpf}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">RG</label>
                <p className="text-sm text-gray-900">{data.additionalContact.rg}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nacionalidade</label>
                <p className="text-sm text-gray-900">{data.additionalContact.nationality}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado Civil</label>
                <p className="text-sm text-gray-900">{data.additionalContact.maritalStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
                <p className="text-sm text-gray-900">{formatDate(data.additionalContact.birthDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                <p className="text-sm text-gray-900">{data.additionalContact.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-sm text-gray-900">{data.additionalContact.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Endereço</label>
                <p className="text-sm text-gray-900">{data.additionalContact.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CEP</label>
                <p className="text-sm text-gray-900">{data.additionalContact.zipCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cidade</label>
                <p className="text-sm text-gray-900">{data.additionalContact.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bairro</label>
                <p className="text-sm text-gray-900">{data.additionalContact.neighborhood}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <p className="text-sm text-gray-900">{data.additionalContact.state}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados do Imóvel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary-600" />
            Dados do Imóvel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Empreendimento</label>
              <p className="text-sm text-gray-900">{data.property.development}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Unidade</label>
              <p className="text-sm text-gray-900">{data.property.unit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Andar</label>
              <p className="text-sm text-gray-900">{data.property.floor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Torre</label>
              <p className="text-sm text-gray-900">{data.property.tower}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reservado até</label>
              <p className="text-sm text-gray-900">{formatDate(data.property.reservedUntil)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-600" />
            Parcelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.installments.map((installment, index) => (
              <div key={installment.id} className="relative">
                {/* Conector visual */}
                {index < data.installments.length - 1 && (
                  <div className="absolute left-6 top-16 w-px h-8 bg-gray-200" />
                )}
                
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Ícone da parcela */}
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Conteúdo da parcela */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {getPaymentConditionLabel(installment.condition)}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Valor */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Valor
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(installment.value)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quantidade */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Quantidade
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {installment.quantity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {installment.condition === 'sinal' ? 'vez' : 
                             installment.condition === 'mensal' ? 'meses' : 'semestres'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Data */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Data
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <span className="text-lg font-semibold text-gray-900">
                            {formatDate(installment.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Valor total da parcela */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Valor Total:
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(installment.value * installment.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Resumo total */}
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Valor Total da Proposta:
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(data.installments.reduce((total, installment) => 
                    total + (installment.value * installment.quantity), 0
                  ))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
