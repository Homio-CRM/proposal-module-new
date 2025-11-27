'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactCard } from '@/components/ContactCard'
import { ProposalFormData, PaymentCondition } from '@/lib/types/proposal'
import { 
  FileText, 
  Building, 
  CreditCard,
  Calendar
} from 'lucide-react'

interface ProposalDetailsProps {
  data: ProposalFormData
  locationId: string
}

export function ProposalDetails({ data, locationId }: ProposalDetailsProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '—'
    }
    try {
      // Se a string está no formato YYYY-MM-DD, parse como data local
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        if (isNaN(date.getTime())) {
          return '—'
        }
        return date.toLocaleDateString('pt-BR')
      }
      // Caso contrário, usar o comportamento padrão
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '—'
      }
      return date.toLocaleDateString('pt-BR')
    } catch {
      return '—'
    }
  }

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) {
      return '—'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatField = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') {
      return '—'
    }
    if (typeof value === 'string' && value.trim() === '') {
      return '—'
    }
    return String(value)
  }

  const getPaymentConditionLabel = (condition: PaymentCondition) => {
    switch (condition) {
      case 'sinal':
        return 'Sinal'
      case 'parcela_unica':
        return 'Parcela única'
      case 'financiamento':
        return 'Financiamento'
      case 'mensais':
        return 'Mensais'
      case 'intermediarias':
        return 'Intermediárias'
      case 'anuais':
        return 'Anuais'
      case 'semestrais':
        return 'Semestrais'
      case 'bimestrais':
        return 'Bimestrais'
      case 'trimestrais':
        return 'Trimestrais'
    }
  }

  const getUnitStatusLabel = (status?: string) => {
    if (!status) return 'N/A'
    
    switch (status.toLowerCase()) {
      case 'available':
        return 'Disponível'
      case 'reserved':
        return 'Reservada'
      case 'sold':
        return 'Vendida'
      case 'maintenance':
        return 'Em Manutenção'
      default:
        return status
    }
  }

  const getUnitStatusBadgeVariant = (status?: string) => {
    if (!status) return 'outline'
    
    switch (status.toLowerCase()) {
      case 'available':
        return 'success'
      case 'reserved':
        return 'warning'
      case 'sold':
        return 'destructive'
      case 'maintenance':
        return 'secondary'
      default:
        return 'outline'
    }
  }


  const handleOpportunityClick = () => {
    if (data.proposal.opportunityId) {
      const url = `https://app.homio.com.br/v2/location/${locationId}/opportunities/list/${data.proposal.opportunityId}?tab=Detalhes+da+oportunidade`
      window.open(url, '_blank')
    }
  }

  const handlePropertyClick = () => {
    if (data.property.buildingId && data.property.unitId) {
      router.push(`/buildings/${data.property.buildingId}/${data.property.unitId}`)
    }
  }



  return (
    <div className="space-y-6">
      {/* Dados da Proposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <button
              onClick={handleOpportunityClick}
              className={`flex items-center gap-2 transition-colors ${
                data.proposal.opportunityId 
                  ? 'hover:text-primary-700 cursor-pointer' 
                  : 'cursor-default opacity-50'
              }`}
              disabled={!data.proposal.opportunityId}
              title={data.proposal.opportunityId ? 'Abrir oportunidade no Homio' : 'ID da oportunidade não disponível'}
            >
              <FileText className="h-5 w-5 text-primary-600" />
              Dados da Proposta
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ID da Oportunidade</label>
              <p className="text-sm text-gray-900">{formatField(data.proposal.opportunityId)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data da Proposta</label>
              <p className="text-sm text-gray-900">{formatDate(data.proposal.proposalDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Responsável</label>
              <p className="text-sm text-gray-900">{formatField(data.proposal.responsible)}</p>
            </div>
            {data.property.observations && data.property.observations.trim() !== '' && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <p className="text-sm text-gray-900">{formatField(data.property.observations)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato Principal */}
      <ContactCard
        title="Contato Principal"
        icon="primary"
        contactId={data.primaryContact.homioId || null}
        locationId={locationId}
        fallbackData={{
          ...data.primaryContact,
          homioId: data.primaryContact.homioId || ''
        }}
        forceRefresh={true}
      />

      {/* Contato Adicional */}
      {data.additionalContact && (
        <ContactCard
          title="Contato Adicional"
          icon="additional"
          contactId={data.additionalContact.homioId || null}
          locationId={locationId}
          fallbackData={{
            ...data.additionalContact,
            homioId: data.additionalContact.homioId || ''
          }}
          forceRefresh={true}
        />
      )}

      {/* Dados do Imóvel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <button
              onClick={handlePropertyClick}
              className={`flex items-center gap-2 transition-colors ${
                data.property.buildingId && data.property.unitId
                  ? 'hover:text-primary-700 cursor-pointer' 
                  : 'cursor-default opacity-50'
              }`}
              disabled={!data.property.buildingId || !data.property.unitId}
              title={data.property.buildingId && data.property.unitId ? 'Ver detalhes da unidade' : 'ID do imóvel não disponível'}
            >
              <Building className="h-5 w-5 text-primary-600" />
              Dados do Imóvel
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Empreendimento</label>
              <p className="text-sm text-gray-900">{formatField(data.property.development)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Unidade</label>
              <p className="text-sm text-gray-900">{formatField(data.property.unit)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Andar</label>
              <p className="text-sm text-gray-900">{formatField(data.property.floor)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Torre</label>
              <p className="text-sm text-gray-900">{formatField(data.property.tower)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reservado até</label>
              <p className="text-sm text-gray-900">{formatDate(data.property.reservedUntil || '')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status da Unidade</label>
              <div className="mt-1">
                <Badge variant={getUnitStatusBadgeVariant(data.property.unitStatus)}>
                  {getUnitStatusLabel(data.property.unitStatus)}
                </Badge>
              </div>
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
                            {(() => {
                              switch (installment.condition) {
                                case 'sinal':
                                case 'parcela_unica':
                                  return 'vez'
                                case 'mensais':
                                case 'financiamento':
                                  return 'meses'
                                case 'bimestrais':
                                  return 'bimestres'
                                case 'trimestrais':
                                  return 'trimestres'
                                case 'semestrais':
                                  return 'semestres'
                                case 'anuais':
                                  return 'anos'
                                case 'intermediarias':
                                  return 'vezes'
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Data(s) */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {installment.condition === 'intermediarias' && installment.dates && installment.dates.length > 1 ? 'Datas' : 'Data'}
                        </label>
                        {installment.condition === 'intermediarias' && installment.dates && installment.dates.length > 1 ? (
                          <div className="space-y-2">
                            {installment.dates.map((date, dateIndex) => (
                              <div key={dateIndex} className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-900">
                                  Parcela {dateIndex + 1}: {formatDate(date)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <span className="text-lg font-semibold text-gray-900">
                              {formatDate(installment.date)}
                            </span>
                          </div>
                        )}
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
