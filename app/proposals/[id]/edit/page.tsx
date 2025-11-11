'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { ProposalSkeleton } from '@/components/skeletons/ProposalSkeleton'
import ProposalForm from '@/components/ProposalForm'
import { dataService } from '@/lib/services/dataService'
import { ProposalFormData } from '@/lib/types/proposal'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreferencesContext } from '@/lib/contexts/PreferencesContext'
import { canManageProposals as canManageProposalsPermission, restrictProposalsToCreator } from '@/lib/utils/permissions'

export default function EditProposalPage() {
  const params = useParams()
  const router = useRouter()
  const { userData, loading, error } = useUserDataContext()
  const { preferences, loading: preferencesLoading } = usePreferencesContext()
  
  const proposalId = params.id as string
  const [proposalDetails, setProposalDetails] = useState<ProposalFormData | null>(null)
  const [proposalLoading, setProposalLoading] = useState(true)
  const [proposalError, setProposalError] = useState<string | null>(null)

  useEffect(() => {
    const loadProposalData = async () => {
      if (!proposalId) return

      try {
        setProposalLoading(true)
        setProposalError(null)

        const restrictToCreator = userData?.role
          ? (restrictProposalsToCreator(preferences ?? null, userData.role) ? userData.userId : undefined)
          : undefined

        const result = await dataService.fetchProposalDetails(
          proposalId,
          restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
        )
        if (!result) {
          setProposalError('Detalhes da proposta não encontrados')
          return
        }

        setProposalDetails(result.proposalFormData)
      } catch (error) {
        console.error('Erro ao carregar proposta:', error)
        setProposalError('Erro ao carregar proposta')
      } finally {
        setProposalLoading(false)
      }
    }

    if (userData && !loading && !preferencesLoading) {
      loadProposalData()
    }
  }, [userData, loading, preferencesLoading, proposalId, preferences])

  if (loading || proposalLoading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" disabled className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          <ProposalSkeleton />
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
          <Button
            variant="outline"
            onClick={() => router.push('/proposals')}
            className="mt-4"
          >
            Voltar para Propostas
          </Button>
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

  const allowManageProposals = canManageProposalsPermission(preferences ?? null, userData.role)

  if (!allowManageProposals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Sem permissão para editar propostas</h2>
          <p className="text-neutral-600">Solicite acesso a um administrador.</p>
          <Button
            variant="outline"
            onClick={() => router.push('/proposals')}
            className="mt-4"
          >
            Voltar para Propostas
          </Button>
        </div>
      </div>
    )
  }

  if (!proposalDetails) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6">
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

  return <ProposalForm initialData={proposalDetails} proposalId={proposalId} />
}

