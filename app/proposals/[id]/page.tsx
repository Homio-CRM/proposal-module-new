'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProposalSkeleton } from '@/components/skeletons/ProposalSkeleton'
import { ProposalDetails } from '@/components/ProposalDetails'
import { ProposalStatusChanger } from '@/components/ProposalStatusChanger'
import { dataService } from '@/lib/services/dataService'
import { ProposalFormData, ProposalListItem, ProposalStatus } from '@/lib/types/proposal'
import { clearContactCache } from '@/hooks/useContactData'
import { ArrowLeft, AlertCircle, Edit } from 'lucide-react'

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userData, loading, error } = useUserDataContext()
  
  const proposalId = params.id as string
  const [proposal, setProposal] = useState<ProposalListItem | null>(null)
  const [proposalDetails, setProposalDetails] = useState<ProposalFormData | null>(null)
  const [createdByName, setCreatedByName] = useState<string | null>(null)
  const [proposalLoading, setProposalLoading] = useState(true)
  const [proposalError, setProposalError] = useState<string | null>(null)
  const [webhookErrorDialogOpen, setWebhookErrorDialogOpen] = useState(false)
  
  const handleStatusChange = async (newStatus: ProposalStatus, updateUnitStatus?: boolean, reservedUntil?: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          updateUnitStatus: updateUnitStatus === true,
          reservedUntil: reservedUntil || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao atualizar status' }))
        console.error('[handleStatusChange] Erro detalhado:', errorData)
        
        if (errorData.webhookError) {
          setWebhookErrorDialogOpen(true)
          return
        }
        
        const errorMessage = errorData.error || errorData.supabase?.message || 'Erro ao atualizar status'
        throw new Error(errorMessage)
      }

      const responseData = await response.json().catch(() => null)
      
      if (userData?.companyId) {
        dataService.clearProposalsCache(userData.companyId)
      }

      setProposal(prev => {
        if (!prev) return prev
        return {
          ...prev,
          status: responseData?.status || newStatus
        }
      })

      setProposalDetails(prev => {
        if (!prev) return prev
        const updatedProperty = { ...prev.property }
        
        if (reservedUntil !== undefined) {
          updatedProperty.reservedUntil = reservedUntil || ''
        }
        
        // Atualizar o status da unidade quando updateUnitStatus é true
        if (updateUnitStatus) {
          if (newStatus === 'aprovada') {
            updatedProperty.unitStatus = 'sold'
          } else if (newStatus === 'negada') {
            updatedProperty.unitStatus = 'available'
          } else if (newStatus === 'em_analise' && reservedUntil) {
            updatedProperty.unitStatus = 'reserved'
          }
        }
        
        return {
          ...prev,
          proposal: {
            ...prev.proposal,
            proposalStatus: responseData?.status || newStatus
          },
          property: updatedProperty
        }
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      throw error
    }
  }

  useEffect(() => {
    const loadProposalData = async () => {
      if (!userData?.companyId || !proposalId) return

      try {
        setProposalLoading(true)
        setProposalError(null)

        // Buscar lista de propostas para obter dados básicos
        const proposalsData = await dataService.fetchProposalsData(userData.companyId)
        const foundProposal = proposalsData.find(p => p.id === proposalId)
        
        if (!foundProposal) {
          setProposalError('Proposta não encontrada')
          return
        }

        setProposal(foundProposal)

        // Buscar detalhes completos da proposta
        const result = await dataService.fetchProposalDetails(proposalId)
        if (!result) {
          setProposalError('Detalhes da proposta não encontrados')
          return
        }

        const { proposalFormData: details, createdByName } = result

        // Limpar cache dos contatos para forçar busca atualizada
        if (details.primaryContact.homioId) {
          clearContactCache(details.primaryContact.homioId, userData.activeLocation)
        }
        if (details.additionalContact?.homioId) {
          clearContactCache(details.additionalContact.homioId, userData.activeLocation)
        }

        setProposalDetails(details)
        setCreatedByName(createdByName)
      } catch (error) {
        console.error('Erro ao carregar proposta:', error)
        setProposalError('Erro ao carregar proposta')
      } finally {
        setProposalLoading(false)
      }
    }

    if (userData && !loading) {
      loadProposalData()
    }
  }, [userData, loading, proposalId])

  if (loading || proposalLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" disabled className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            
            <ProposalSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error || proposalError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">Erro: {error || proposalError}</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <p className="text-neutral-600">Usuário não autenticado</p>
        </div>
      </div>
    )
  }

  if (!proposal || !proposalDetails) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/proposals')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Proposta não encontrada
              </h2>
              <p className="text-gray-600">
                A proposta com ID &quot;{proposalId}&quot; não foi encontrada.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/proposals')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {proposal.title}
                </h1>
                <p className="text-gray-400">
                  {createdByName ? `Criada por ${createdByName}` : 'Criador não informado'}
                </p>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => router.push(`/proposals/${proposalId}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Proposta
            </Button>
          </div>

          {/* Status Changer */}
          <ProposalStatusChanger
            proposalId={proposalId}
            currentStatus={proposal.status}
            unitId={proposalDetails.property.unitId}
            onStatusChange={handleStatusChange}
          />

          {/* Proposal Details */}
          <ProposalDetails data={proposalDetails} locationId={userData.activeLocation} />
        </div>
      </div>

      <Dialog open={webhookErrorDialogOpen} onOpenChange={setWebhookErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao atualizar status
            </DialogTitle>
            <DialogDescription className="pt-2">
              Ocorreu um erro ao atualizar o status da unidade. Por favor, entre em contato com os desenvolvedores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setWebhookErrorDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
