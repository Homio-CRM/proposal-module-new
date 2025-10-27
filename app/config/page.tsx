'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { dataService, AgencyConfig } from '@/lib/services/dataService'

interface ConfigData {
  opportunityFields: {
    empreendimento: string
    unidade: string
    responsavel: string
    observacoes: string
    reserve_until: string
  }
  contactFields: {
    empreendimento: string
    unidade: string
    andar: string
    torre: string
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
}

export default function ConfigPage() {
  const { userData, loading } = useUserDataContext()
  const { setCustomFieldIds, getCustomFieldId } = useCustomFieldsContext()
  const router = useRouter()
  
  // Usar ref para evitar loop infinito
  const setCustomFieldIdsRef = useRef(setCustomFieldIds)
  setCustomFieldIdsRef.current = setCustomFieldIds
  
  const [configData, setConfigData] = useState<ConfigData>({
    opportunityFields: {
      empreendimento: '',
      unidade: '',
      responsavel: '',
      observacoes: '',
      reserve_until: ''
    },
    contactFields: {
      empreendimento: '',
      unidade: '',
      andar: '',
      torre: '',
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
    }
  })
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const agencyName = agencyConfig?.opportunity_name || "MIVITA"
  const locationId = userData?.activeLocation || ''

  useEffect(() => {
    const loadAgencyConfig = async () => {
      if (!userData?.activeLocation) {
        return;
      }
      
      try {
        setConfigLoading(true);
        
        // 1. Carregar configuração primeiro (sem custom fields)
        const config = await dataService.fetchAgencyConfigOnly(userData.activeLocation);
        
        if (!config) {
          return;
        }

        setAgencyConfig(config);
        
        // Preencher campos imediatamente
        const newConfigData = {
          opportunityFields: {
            empreendimento: config.opportunity_building || '',
            unidade: config.opportunity_unit || '',
            responsavel: config.opportunity_responsible || '',
            observacoes: config.opportunity_observations || '',
            reserve_until: config.opportunity_reserve_until || ''
          },
          contactFields: {
            empreendimento: config.contact_building || '',
            unidade: config.contact_unit || '',
            andar: config.contact_floor || '',
            torre: config.contact_tower || '',
            cpf: config.contact_cpf || '',
            rg: config.contact_rg || '',
            orgaoEmissor: config.contact_rg_issuer || '',
            nacionalidade: config.contact_nationality || '',
            estadoCivil: config.contact_marital_status || '',
            profissao: config.contact_profession || '',
            cep: config.contact_postal_code || '',
            endereco: config.contact_address || '',
            cidade: config.contact_city || '',
            bairro: config.contact_neighborhood || '',
            estado: config.contact_state || ''
          }
        };
        setConfigData(newConfigData);

        // 2. Buscar custom field IDs em background (não bloquear)
        dataService.fetchCustomFieldIdsForConfig(userData.activeLocation, config)
          .then(customFieldIds => {
            console.log('🔍 [ConfigPage] Custom field IDs recebidos:', customFieldIds);
            setCustomFieldIdsRef.current(customFieldIds);
          })
          .catch(error => {
            console.error('❌ [ConfigPage] Erro ao buscar custom field IDs:', error);
          });

      } catch (error) {
      } finally {
        setConfigLoading(false);
      }
    };

    if (userData && !loading) {
      loadAgencyConfig();
    }
  }, [userData, loading]);

  const handleInputChange = (section: keyof ConfigData, field: string, value: string) => {
    setConfigData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!userData?.activeLocation) {
      return
    }

    try {
      setConfigLoading(true)

      // Salvar configuração e remapear custom fields
      const result = await dataService.saveAgencyConfigAndRemapFields(
        userData.activeLocation,
        configData
      )

      // Atualizar estado local
      setAgencyConfig(result.config)
      setCustomFieldIds(result.customFieldIds)

      // Mostrar modal de sucesso
      setShowSuccessModal(true)
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setConfigLoading(false)
    }
  }


  if (loading || configLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Opportunity Fields Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Fields Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Button skeleton */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Configurações da Conta</h1>
          <p className="text-neutral-600 mt-2">Configure as informações da sua conta e campos customizados</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/proposals')}
        >
          Voltar para Propostas
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                <span className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Conta Ativa</span>
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 mt-2">{agencyName}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                  {locationId}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos Customizados - Oportunidade</CardTitle>
            <CardDescription>Configure os campos para parsear dados de oportunidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="empreendimento" className="block text-sm font-medium text-neutral-700 mb-2">
                  Empreendimento
                </label>
                <Input
                  id="empreendimento"
                  value={configData.opportunityFields.empreendimento}
                  onChange={(e) => handleInputChange('opportunityFields', 'empreendimento', e.target.value)}
                  placeholder="Campo para empreendimento"
                />
                {(configData.opportunityFields.empreendimento || getCustomFieldId('opportunityFields', 'empreendimento', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'empreendimento', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="unidade" className="block text-sm font-medium text-neutral-700 mb-2">
                  Unidade
                </label>
                <Input
                  id="unidade"
                  value={configData.opportunityFields.unidade}
                  onChange={(e) => handleInputChange('opportunityFields', 'unidade', e.target.value)}
                  placeholder="Campo para unidade"
                />
                {(configData.opportunityFields.unidade || getCustomFieldId('opportunityFields', 'unidade', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'unidade', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="responsavel" className="block text-sm font-medium text-neutral-700 mb-2">
                  Responsável
                </label>
                <Input
                  id="responsavel"
                  value={configData.opportunityFields.responsavel}
                  onChange={(e) => handleInputChange('opportunityFields', 'responsavel', e.target.value)}
                  placeholder="Campo para responsável"
                />
                {(configData.opportunityFields.responsavel || getCustomFieldId('opportunityFields', 'responsavel', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'responsavel', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Observações
                </label>
                <Input
                  id="observacoes"
                  value={configData.opportunityFields.observacoes}
                  onChange={(e) => handleInputChange('opportunityFields', 'observacoes', e.target.value)}
                  placeholder="Campo para observações"
                />
                {(configData.opportunityFields.observacoes || getCustomFieldId('opportunityFields', 'observacoes', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'observacoes', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="reserve_until" className="block text-sm font-medium text-neutral-700 mb-2">
                  Reservado Até
                </label>
                <Input
                  id="reserve_until"
                  value={configData.opportunityFields.reserve_until}
                  onChange={(e) => handleInputChange('opportunityFields', 'reserve_until', e.target.value)}
                  placeholder="Campo para reservado até"
                />
                {(configData.opportunityFields.reserve_until || getCustomFieldId('opportunityFields', 'reserve_until', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'reserve_until', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos Customizados - Contato</CardTitle>
            <CardDescription>Configure os campos para parsear dados de contatos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="empreendimento" className="block text-sm font-medium text-neutral-700 mb-2">
                  Empreendimento
                </label>
                <Input
                  id="empreendimento"
                  value={configData.contactFields.empreendimento}
                  onChange={(e) => handleInputChange('contactFields', 'empreendimento', e.target.value)}
                  placeholder="Campo para empreendimento"
                />
                {(configData.contactFields.empreendimento || getCustomFieldId('contactFields', 'empreendimento', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'empreendimento', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="unidade" className="block text-sm font-medium text-neutral-700 mb-2">
                  Unidade
                </label>
                <Input
                  id="unidade"
                  value={configData.contactFields.unidade}
                  onChange={(e) => handleInputChange('contactFields', 'unidade', e.target.value)}
                  placeholder="Campo para unidade"
                />
                {(configData.contactFields.unidade || getCustomFieldId('contactFields', 'unidade', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'unidade', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="andar" className="block text-sm font-medium text-neutral-700 mb-2">
                  Andar
                </label>
                <Input
                  id="andar"
                  value={configData.contactFields.andar}
                  onChange={(e) => handleInputChange('contactFields', 'andar', e.target.value)}
                  placeholder="Campo para andar"
                />
                {(configData.contactFields.andar || getCustomFieldId('contactFields', 'andar', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'andar', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="torre" className="block text-sm font-medium text-neutral-700 mb-2">
                  Torre
                </label>
                <Input
                  id="torre"
                  value={configData.contactFields.torre}
                  onChange={(e) => handleInputChange('contactFields', 'torre', e.target.value)}
                  placeholder="Campo para torre"
                />
                {(configData.contactFields.torre || getCustomFieldId('contactFields', 'torre', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'torre', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-neutral-700 mb-2">
                  CPF
                </label>
                <Input
                  id="cpf"
                  value={configData.contactFields.cpf}
                  onChange={(e) => handleInputChange('contactFields', 'cpf', e.target.value)}
                  placeholder="Campo para CPF"
                />
                {(configData.contactFields.cpf || getCustomFieldId('contactFields', 'cpf', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cpf', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-neutral-700 mb-2">
                  RG
                </label>
                <Input
                  id="rg"
                  value={configData.contactFields.rg}
                  onChange={(e) => handleInputChange('contactFields', 'rg', e.target.value)}
                  placeholder="Campo para RG"
                />
                {(configData.contactFields.rg || getCustomFieldId('contactFields', 'rg', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'rg', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="orgaoEmissor" className="block text-sm font-medium text-neutral-700 mb-2">
                  Órgão Emissor do RG
                </label>
                <Input
                  id="orgaoEmissor"
                  value={configData.contactFields.orgaoEmissor}
                  onChange={(e) => handleInputChange('contactFields', 'orgaoEmissor', e.target.value)}
                  placeholder="Campo para órgão emissor"
                />
                {(configData.contactFields.orgaoEmissor || getCustomFieldId('contactFields', 'orgaoEmissor', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'orgaoEmissor', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="nacionalidade" className="block text-sm font-medium text-neutral-700 mb-2">
                  Nacionalidade
                </label>
                <Input
                  id="nacionalidade"
                  value={configData.contactFields.nacionalidade}
                  onChange={(e) => handleInputChange('contactFields', 'nacionalidade', e.target.value)}
                  placeholder="Campo para nacionalidade"
                />
                {(configData.contactFields.nacionalidade || getCustomFieldId('contactFields', 'nacionalidade', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'nacionalidade', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="estadoCivil" className="block text-sm font-medium text-neutral-700 mb-2">
                  Estado Civil
                </label>
                <Input
                  id="estadoCivil"
                  value={configData.contactFields.estadoCivil}
                  onChange={(e) => handleInputChange('contactFields', 'estadoCivil', e.target.value)}
                  placeholder="Campo para estado civil"
                />
                {(configData.contactFields.estadoCivil || getCustomFieldId('contactFields', 'estadoCivil', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'estadoCivil', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="profissao" className="block text-sm font-medium text-neutral-700 mb-2">
                  Profissão
                </label>
                <Input
                  id="profissao"
                  value={configData.contactFields.profissao}
                  onChange={(e) => handleInputChange('contactFields', 'profissao', e.target.value)}
                  placeholder="Campo para profissão"
                />
                {(configData.contactFields.profissao || getCustomFieldId('contactFields', 'profissao', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'profissao', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-neutral-700 mb-2">
                  CEP
                </label>
                <Input
                  id="cep"
                  value={configData.contactFields.cep}
                  onChange={(e) => handleInputChange('contactFields', 'cep', e.target.value)}
                  placeholder="Campo para CEP"
                />
                {(configData.contactFields.cep || getCustomFieldId('contactFields', 'cep', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cep', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-neutral-700 mb-2">
                  Endereço
                </label>
                <Input
                  id="endereco"
                  value={configData.contactFields.endereco}
                  onChange={(e) => handleInputChange('contactFields', 'endereco', e.target.value)}
                  placeholder="Campo para endereço"
                />
                {(configData.contactFields.endereco || getCustomFieldId('contactFields', 'endereco', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'endereco', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cidade" className="block text-sm font-medium text-neutral-700 mb-2">
                  Cidade
                </label>
                <Input
                  id="cidade"
                  value={configData.contactFields.cidade}
                  onChange={(e) => handleInputChange('contactFields', 'cidade', e.target.value)}
                  placeholder="Campo para cidade"
                />
                {(configData.contactFields.cidade || getCustomFieldId('contactFields', 'cidade', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cidade', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="bairro" className="block text-sm font-medium text-neutral-700 mb-2">
                  Bairro
                </label>
                <Input
                  id="bairro"
                  value={configData.contactFields.bairro}
                  onChange={(e) => handleInputChange('contactFields', 'bairro', e.target.value)}
                  placeholder="Campo para bairro"
                />
                {(configData.contactFields.bairro || getCustomFieldId('contactFields', 'bairro', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'bairro', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-neutral-700 mb-2">
                  Estado
                </label>
                <Input
                  id="estado"
                  value={configData.contactFields.estado}
                  onChange={(e) => handleInputChange('contactFields', 'estado', e.target.value)}
                  placeholder="Campo para estado"
                />
                {(configData.contactFields.estado || getCustomFieldId('contactFields', 'estado', configData)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'estado', configData) || 'ID não encontrado'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            size="lg" 
            disabled={configLoading}
          >
            {configLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Configurações Salvas!
            </DialogTitle>
            <DialogDescription>
              Suas configurações foram salvas com sucesso. Os custom fields foram remapeados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
