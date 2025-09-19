'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  User, 
  Building, 
  CreditCard, 
  Calendar,
  FileText,
  Send
} from 'lucide-react'
import type { ProposalFormData } from '@/lib/types/proposal'

interface SummaryStepProps {
  data: ProposalFormData
  onPublish: () => void
}

export default function SummaryStep({ data, onPublish }: SummaryStepProps) {
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await onPublish()
    } finally {
      setIsPublishing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTotalValue = () => {
    return data.installments.reduce((total, installment) => {
      return total + (installment.value * installment.quantity)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Resumo da Proposta
        </h3>
        <p className="text-neutral-600">
          Revise todas as informações antes de publicar a proposta
        </p>
      </div>

      {/* Proposal Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-neutral-900 font-bold">
            <FileText className="h-5 w-5 text-primary-600" />
            <span>Dados da Proposta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">ID da Oportunidade</label>
              <p className="text-neutral-900 font-medium">{data.proposal.opportunityId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Data da Proposta</label>
              <p className="text-neutral-900 font-medium">{formatDate(data.proposal.proposalDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-neutral-900 font-bold">
            <User className="h-5 w-5 text-primary-600" />
            <span>Contato Principal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Nome</label>
              <p className="text-neutral-900 font-medium">{data.primaryContact.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">CPF</label>
              <p className="text-neutral-900 font-medium">{data.primaryContact.cpf}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Email</label>
              <p className="text-neutral-900 font-medium">{data.primaryContact.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Telefone</label>
              <p className="text-neutral-900 font-medium">{data.primaryContact.phone}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-neutral-600">Endereço</label>
              <p className="text-neutral-900 font-medium">
                {data.primaryContact.address}, {data.primaryContact.neighborhood}, {data.primaryContact.city} - {data.primaryContact.state}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Contact */}
      {data.additionalContact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neutral-900 font-bold">
              <User className="h-5 w-5 text-primary-600" />
              <span>Contato Adicional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">Nome</label>
                <p className="text-neutral-900 font-medium">{data.additionalContact.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">CPF</label>
                <p className="text-neutral-900 font-medium">{data.additionalContact.cpf}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Email</label>
                <p className="text-neutral-900 font-medium">{data.additionalContact.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">Telefone</label>
                <p className="text-neutral-900 font-medium">{data.additionalContact.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-neutral-900 font-bold">
            <Building className="h-5 w-5 text-primary-600" />
            <span>Dados do Imóvel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">Empreendimento</label>
              <p className="text-neutral-900 font-medium">{data.property.development}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Unidade</label>
              <p className="text-neutral-900 font-medium">{data.property.unit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Andar</label>
              <p className="text-neutral-900 font-medium">{data.property.floor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Torre</label>
              <p className="text-neutral-900 font-medium">{data.property.tower}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Responsável</label>
              <p className="text-neutral-900 font-medium">{data.property.responsible}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">Reservado até</label>
              <p className="text-neutral-900 font-medium">{formatDate(data.property.reservedUntil)}</p>
            </div>
            {data.property.observations && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-neutral-600">Observações</label>
                <p className="text-neutral-900 font-medium">{data.property.observations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Installments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-neutral-900 font-bold">
            <CreditCard className="h-5 w-5 text-primary-600" />
            <span>Parcelas de Pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.installments.map((installment, index) => (
              <div key={installment.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="capitalize">
                    {installment.condition}
                  </Badge>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {installment.quantity}x de {formatCurrency(installment.value)}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Vencimento: {formatDate(installment.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency(installment.value * installment.quantity)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-neutral-900">Total da Proposta:</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(getTotalValue())}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Publicar Proposta
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
