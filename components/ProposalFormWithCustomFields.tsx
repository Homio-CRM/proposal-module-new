'use client'

import { useState, useEffect } from 'react'
import { useOpportunityData } from '@/hooks/useOpportunityData'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProposalFormData {
  // Opportunity fields
  empreendimento: string
  unidade: string
  andar: string
  torre: string
  responsavel: string
  observacoes: string
  
  // Contact fields
  cpf: string
  rg: string
  orgaoEmissor: string
  nacionalidade: string
  estadoCivil: string
  profissao: string
  cep: string
  endereco: string
  cidade: string
  bairro: string
  estado: string
}

interface ProposalFormWithCustomFieldsProps {
  opportunityId?: string
  onSave?: (data: ProposalFormData) => void
}

export function ProposalFormWithCustomFields({ opportunityId, onSave }: ProposalFormWithCustomFieldsProps) {
  const { loadOpportunityData, loading, error } = useOpportunityData()
  const [formData, setFormData] = useState<ProposalFormData>({
    empreendimento: '',
    unidade: '',
    andar: '',
    torre: '',
    responsavel: '',
    observacoes: '',
    cpf: '',
    rg: '',
    orgaoEmissor: '',
    nacionalidade: '',
    estadoCivil: '',
    profissao: '',
    cep: '',
    endereco: '',
    cidade: '',
    bairro: '',
    estado: ''
  })

  // Carregar dados da oportunidade quando opportunityId for fornecido
  useEffect(() => {
    if (opportunityId) {
      loadOpportunityData(opportunityId)
        .then(({ opportunityFormData, contactFormData }) => {
          // Preencher formulário com dados mapeados
          setFormData(prev => ({
            ...prev,
            ...opportunityFormData,
            ...contactFormData
          }))
        })
        .catch(err => {
          console.error('Erro ao carregar dados da oportunidade:', err)
        })
    }
  }, [opportunityId, loadOpportunityData])

  const handleInputChange = (field: keyof ProposalFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Carregando dados da oportunidade...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Oportunidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Empreendimento</label>
              <Input
                value={formData.empreendimento}
                onChange={(e) => handleInputChange('empreendimento', e.target.value)}
                placeholder="Nome do empreendimento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unidade</label>
              <Input
                value={formData.unidade}
                onChange={(e) => handleInputChange('unidade', e.target.value)}
                placeholder="Número da unidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Andar</label>
              <Input
                value={formData.andar}
                onChange={(e) => handleInputChange('andar', e.target.value)}
                placeholder="Andar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Torre</label>
              <Input
                value={formData.torre}
                onChange={(e) => handleInputChange('torre', e.target.value)}
                placeholder="Torre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Responsável</label>
              <Input
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <Input
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CPF</label>
              <Input
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">RG</label>
              <Input
                value={formData.rg}
                onChange={(e) => handleInputChange('rg', e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Órgão Emissor</label>
              <Input
                value={formData.orgaoEmissor}
                onChange={(e) => handleInputChange('orgaoEmissor', e.target.value)}
                placeholder="SSP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nacionalidade</label>
              <Input
                value={formData.nacionalidade}
                onChange={(e) => handleInputChange('nacionalidade', e.target.value)}
                placeholder="Brasileira"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado Civil</label>
              <Input
                value={formData.estadoCivil}
                onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                placeholder="Solteiro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profissão</label>
              <Input
                value={formData.profissao}
                onChange={(e) => handleInputChange('profissao', e.target.value)}
                placeholder="Engenheiro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CEP</label>
              <Input
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Endereço</label>
              <Input
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, número"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bairro</label>
              <Input
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
                placeholder="Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <Input
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                placeholder="SP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Salvar Proposta
        </Button>
      </div>
    </div>
  )
}
