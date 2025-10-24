'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { Button } from '@/components/ui/button'
import { ProposalSkeleton } from '@/components/skeletons/ProposalSkeleton'
import { ProposalDetails } from '@/components/ProposalDetails'
import { dataService } from '@/lib/services/dataService'
import { ProposalFormData, ProposalListItem } from '@/lib/types/proposal'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userData, loading, error } = useUserDataContext()
  
  const proposalId = params.id as string
  const [proposal, setProposal] = useState<ProposalListItem | null>(null)
  const [proposalDetails, setProposalDetails] = useState<ProposalFormData | null>(null)
  const [proposalLoading, setProposalLoading] = useState(true)
  const [proposalError, setProposalError] = useState<string | null>(null)

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
        const details = await dataService.fetchProposalDetails(proposalId)
        if (!details) {
          setProposalError('Detalhes da proposta não encontrados')
          return
        }

        setProposalDetails(details)
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
                <p className="text-gray-600">
                  Criada em {new Date(proposal.proposalDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Proposal Details */}
          <ProposalDetails data={proposalDetails} locationId={userData.activeLocation} />
        </div>
      </div>
    </div>
  )
}
