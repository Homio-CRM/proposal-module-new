'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { dataService, AgencyConfig } from '@/lib/services/dataService'
import { usePreferencesContext } from '@/lib/contexts/PreferencesContext'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { PreferencesPayload } from '@/lib/types/preferences'

interface ConfigData {
  opportunityFields: {
    empreendimento: string
    unidade: string
    andar: string
    torre: string
    vagas: string
    responsavel: string
    observacoes: string
    reserve_until: string
  }
  contactFields: {
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
  const { preferences, loading: preferencesLoading, update: updatePreferences } = usePreferencesContext()
  const router = useRouter()
  
  // Usar ref para evitar loop infinito
  const setCustomFieldIdsRef = useRef(setCustomFieldIds)
  setCustomFieldIdsRef.current = setCustomFieldIds
  
  const [configData, setConfigData] = useState<ConfigData>({
    opportunityFields: {
      empreendimento: '',
      unidade: '',
      andar: '',
      torre: '',
      vagas: '',
      responsavel: '',
      observacoes: '',
      reserve_until: ''
    },
    contactFields: {
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
  const [tableUrl, setTableUrl] = useState<string>('')
  const [initialTableUrl, setInitialTableUrl] = useState<string>('')
  const [configLoading, setConfigLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successType, setSuccessType] = useState<'permissions' | 'fields' | null>(null)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [savingFields, setSavingFields] = useState(false)
  const [initialConfigData, setInitialConfigData] = useState<ConfigData>({
    opportunityFields: {
      empreendimento: '',
      unidade: '',
      andar: '',
      torre: '',
      vagas: '',
      responsavel: '',
      observacoes: '',
      reserve_until: ''
    },
    contactFields: {
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
  const [initialPreferences, setInitialPreferences] = useState<PreferencesPayload | null>(null)
  const [preferencesForm, setPreferencesForm] = useState<PreferencesPayload>({
    canViewProposals: 'admin',
    canManageProposals: 'admin',
    canViewBuildings: 'admin',
    canManageBuildings: 'admin',
    canManageOnlyAssinedProposals: false
  })

  const agencyName = agencyConfig?.opportunity_name || "MIVITA"
  const locationId = userData?.activeLocation || ''
  const isAdmin = userData?.role === 'admin'

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
        
        setTableUrl(config.table_url || '');
        setInitialTableUrl(config.table_url || '');
        
        // Preencher campos imediatamente
        const newConfigData = {
          opportunityFields: {
            empreendimento: config.opportunity_building || '',
            unidade: config.opportunity_unit || '',
            andar: config.opportunity_floor || '',
            torre: config.opportunity_tower || '',
            vagas: config.opportunity_parking_spots || '',
            responsavel: config.opportunity_responsible || '',
            observacoes: config.opportunity_observations || '',
            reserve_until: config.opportunity_reserve_until || ''
          },
          contactFields: {
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
        setInitialConfigData(JSON.parse(JSON.stringify(newConfigData)));

        // 2. Buscar custom field IDs em background (não bloquear)
        dataService.fetchCustomFieldIdsForConfig(userData.activeLocation, config)
          .then(customFieldIds => {
            setCustomFieldIdsRef.current(customFieldIds);
          })
          .catch(error => {
            console.error('❌ [ConfigPage] Erro ao buscar custom field IDs:', error);
          });

      } catch {
      } finally {
        setConfigLoading(false);
      }
    };

    if (userData && !loading) {
      loadAgencyConfig();
    }
  }, [userData, loading]);

  useEffect(() => {
    if (preferences) {
      const mapped: PreferencesPayload = {
        canViewProposals: preferences.canViewProposals,
        canManageProposals: preferences.canManageProposals,
        canViewBuildings: preferences.canViewBuildings,
        canManageBuildings: preferences.canManageBuildings,
        canManageOnlyAssinedProposals: preferences.canManageOnlyAssinedProposals
      }
      if (initialPreferences === null) {
        setInitialPreferences({ ...mapped })
      }
      setPreferencesForm(mapped)
    }
  }, [preferences, initialPreferences])

  const handleInputChange = (section: keyof ConfigData, field: string, value: string) => {
    setConfigData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handlePermissionChange = <K extends keyof PreferencesPayload>(field: K, value: PreferencesPayload[K]) => {
    setPreferencesForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const hasPreferenceChanges = useMemo(() => {
    if (!initialPreferences) {
      return false
    }
    return JSON.stringify(initialPreferences) !== JSON.stringify(preferencesForm)
  }, [initialPreferences, preferencesForm])

  const hasFieldChanges = useMemo(() => {
    return JSON.stringify(configData) !== JSON.stringify(initialConfigData) || tableUrl !== initialTableUrl
  }, [configData, initialConfigData, tableUrl, initialTableUrl])

  const handleSavePermissions = async () => {
    if (!isAdmin || !userData?.activeLocation || !hasPreferenceChanges) {
      return
    }
    try {
      setSavingPermissions(true)
      await updatePreferences(preferencesForm)
      const savedPreferences: PreferencesPayload = {
        canViewProposals: preferencesForm.canViewProposals,
        canManageProposals: preferencesForm.canManageProposals,
        canViewBuildings: preferencesForm.canViewBuildings,
        canManageBuildings: preferencesForm.canManageBuildings,
        canManageOnlyAssinedProposals: preferencesForm.canManageOnlyAssinedProposals
      }
      setInitialPreferences(savedPreferences)
      setSuccessType('permissions')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('❌ Erro ao salvar permissões:', error)
      alert('Erro ao salvar permissões. Tente novamente.')
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleSaveCustomFields = async () => {
    if (!userData?.activeLocation || !hasFieldChanges) {
      return
    }

    try {
      setSavingFields(true)

      const result = await dataService.saveAgencyConfigAndRemapFields(
        userData.activeLocation,
        {
          ...configData,
          table_url: tableUrl
        }
      )

      setAgencyConfig(result.config)
      setCustomFieldIds(result.customFieldIds)
      setInitialConfigData(JSON.parse(JSON.stringify(configData)))
      setInitialTableUrl(tableUrl)
      setSuccessType('fields')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('❌ Erro ao salvar campos customizados:', error)
      alert('Erro ao salvar campos customizados. Tente novamente.')
    } finally {
      setSavingFields(false)
    }
  }


  const showSkeleton = loading || configLoading || (preferencesLoading && !preferences)

  if (showSkeleton) {
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Acesso restrito</h2>
          <p className="text-neutral-600">Apenas usuários administradores podem acessar esta página.</p>
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
            <CardTitle>Permissões da Plataforma</CardTitle>
            <CardDescription>Controle de acesso a propostas e empreendimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visualizar Propostas</Label>
                <Select
                  value={preferencesForm.canViewProposals}
                  onChange={(event) => handlePermissionChange('canViewProposals', event.target.value as PreferencesPayload['canViewProposals'])}
                  disabled={!isAdmin || preferencesLoading}
                >
                  <option value="admin">Somente administradores</option>
                  <option value="adminAndUser">Administradores e usuários</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gerenciar Propostas</Label>
                <Select
                  value={preferencesForm.canManageProposals}
                  onChange={(event) => handlePermissionChange('canManageProposals', event.target.value as PreferencesPayload['canManageProposals'])}
                  disabled={!isAdmin || preferencesLoading}
                >
                  <option value="admin">Somente administradores</option>
                  <option value="adminAndUser">Administradores e usuários</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visualizar Empreendimentos</Label>
                <Select
                  value={preferencesForm.canViewBuildings}
                  onChange={(event) => handlePermissionChange('canViewBuildings', event.target.value as PreferencesPayload['canViewBuildings'])}
                  disabled={!isAdmin || preferencesLoading}
                >
                  <option value="admin">Somente administradores</option>
                  <option value="adminAndUser">Administradores e usuários</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gerenciar Empreendimentos</Label>
                <Select
                  value={preferencesForm.canManageBuildings}
                  onChange={(event) => handlePermissionChange('canManageBuildings', event.target.value as PreferencesPayload['canManageBuildings'])}
                  disabled={!isAdmin || preferencesLoading}
                >
                  <option value="admin">Somente administradores</option>
                  <option value="adminAndUser">Administradores e usuários</option>
                </Select>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-neutral-200 p-4">
              <Checkbox
                id="canManageOnlyAssinedProposals"
                checked={preferencesForm.canManageOnlyAssinedProposals}
                onCheckedChange={(checked) =>
                  handlePermissionChange(
                    'canManageOnlyAssinedProposals',
                    Boolean(checked) as PreferencesPayload['canManageOnlyAssinedProposals']
                  )
                }
                disabled={!isAdmin || preferencesLoading}
              />
              <div className="space-y-1">
                <Label htmlFor="canManageOnlyAssinedProposals">Limitar usuários às propostas próprias</Label>
                <p className="text-sm text-neutral-600">
                  Quando ativo, usuários não administradores só podem visualizar e editar propostas criadas por eles mesmos.
                </p>
              </div>
            </div>
          </CardContent>
          {isAdmin && (
            <div className="flex justify-end px-6 pb-6">
              <Button
                onClick={handleSavePermissions}
                disabled={savingPermissions || preferencesLoading || !hasPreferenceChanges}
              >
                {savingPermissions ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </div>
          )}
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
                {(configData.opportunityFields.empreendimento || getCustomFieldId('opportunityFields', 'empreendimento')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'empreendimento') || 'ID não encontrado'}
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
                {(configData.opportunityFields.unidade || getCustomFieldId('opportunityFields', 'unidade')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'unidade') || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="andar" className="block text-sm font-medium text-neutral-700 mb-2">
                  Andar
                </label>
                <Input
                  id="andar"
                  value={configData.opportunityFields.andar}
                  onChange={(e) => handleInputChange('opportunityFields', 'andar', e.target.value)}
                  placeholder="Campo para andar"
                />
                {(configData.opportunityFields.andar || getCustomFieldId('opportunityFields', 'andar')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'andar') || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="torre" className="block text-sm font-medium text-neutral-700 mb-2">
                  Torre
                </label>
                <Input
                  id="torre"
                  value={configData.opportunityFields.torre}
                  onChange={(e) => handleInputChange('opportunityFields', 'torre', e.target.value)}
                  placeholder="Campo para torre"
                />
                {(configData.opportunityFields.torre || getCustomFieldId('opportunityFields', 'torre')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'torre') || 'ID não encontrado'}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="vagas" className="block text-sm font-medium text-neutral-700 mb-2">
                  Vagas
                </label>
                <Input
                  id="vagas"
                  value={configData.opportunityFields.vagas}
                  onChange={(e) => handleInputChange('opportunityFields', 'vagas', e.target.value)}
                  placeholder="Campo para vagas"
                />
                {(configData.opportunityFields.vagas || getCustomFieldId('opportunityFields', 'vagas')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'vagas') || 'ID não encontrado'}
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
                {(configData.opportunityFields.responsavel || getCustomFieldId('opportunityFields', 'responsavel')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'responsavel') || 'ID não encontrado'}
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
                {(configData.opportunityFields.observacoes || getCustomFieldId('opportunityFields', 'observacoes')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'observacoes') || 'ID não encontrado'}
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
                {(configData.opportunityFields.reserve_until || getCustomFieldId('opportunityFields', 'reserve_until')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('opportunityFields', 'reserve_until') || 'ID não encontrado'}
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
                <label htmlFor="cpf" className="block text-sm font-medium text-neutral-700 mb-2">
                  CPF
                </label>
                <Input
                  id="cpf"
                  value={configData.contactFields.cpf}
                  onChange={(e) => handleInputChange('contactFields', 'cpf', e.target.value)}
                  placeholder="Campo para CPF"
                />
                {(configData.contactFields.cpf || getCustomFieldId('contactFields', 'cpf')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cpf') || 'ID não encontrado'}
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
                {(configData.contactFields.rg || getCustomFieldId('contactFields', 'rg')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'rg') || 'ID não encontrado'}
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
                {(configData.contactFields.orgaoEmissor || getCustomFieldId('contactFields', 'orgaoEmissor')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'orgaoEmissor') || 'ID não encontrado'}
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
                {(configData.contactFields.nacionalidade || getCustomFieldId('contactFields', 'nacionalidade')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'nacionalidade') || 'ID não encontrado'}
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
                {(configData.contactFields.estadoCivil || getCustomFieldId('contactFields', 'estadoCivil')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'estadoCivil') || 'ID não encontrado'}
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
                {(configData.contactFields.profissao || getCustomFieldId('contactFields', 'profissao')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'profissao') || 'ID não encontrado'}
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
                {(configData.contactFields.cep || getCustomFieldId('contactFields', 'cep')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cep') || 'ID não encontrado'}
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
                {(configData.contactFields.endereco || getCustomFieldId('contactFields', 'endereco')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'endereco') || 'ID não encontrado'}
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
                {(configData.contactFields.cidade || getCustomFieldId('contactFields', 'cidade')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'cidade') || 'ID não encontrado'}
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
                {(configData.contactFields.bairro || getCustomFieldId('contactFields', 'bairro')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'bairro') || 'ID não encontrado'}
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
                {(configData.contactFields.estado || getCustomFieldId('contactFields', 'estado')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {getCustomFieldId('contactFields', 'estado') || 'ID não encontrado'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL da Tabela</CardTitle>
            <CardDescription>Configure o link da tabela que será usado no botão &quot;Ir para Tabela&quot; na página de propostas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="table_url" className="block text-sm font-medium text-neutral-700 mb-2">
                URL da Tabela
              </label>
              <Input
                id="table_url"
                type="url"
                value={tableUrl}
                onChange={(e) => setTableUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveCustomFields}
            size="lg"
            disabled={savingFields || !hasFieldChanges}
          >
            {savingFields ? 'Salvando...' : 'Salvar Campos Customizados'}
          </Button>
        </div>
      </div>

      {/* Modal de Sucesso */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={(open) => {
          setShowSuccessModal(open)
          if (!open) {
            setSuccessType(null)
          }
        }}
      >
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
              {successType === 'permissions'
                ? 'Permissões atualizadas com sucesso.'
                : 'Campos customizados salvos com sucesso.'}
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
