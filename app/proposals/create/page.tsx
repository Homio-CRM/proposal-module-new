'use client'

import ProposalForm from '@/components/ProposalForm'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { usePreferencesContext } from '@/lib/contexts/PreferencesContext'
import { canManageProposals as canManageProposalsPermission } from '@/lib/utils/permissions'

export default function ProposalFormPage() {
  const { userData, loading, error } = useUserDataContext()
  const { preferences, loading: preferencesLoading } = usePreferencesContext()

  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500 text-sm">Carregando permissões...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-xl">❌</div>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <p className="text-neutral-600">Usuário não autenticado</p>
        </div>
      </div>
    )
  }

  const allowManageProposals = canManageProposalsPermission(preferences ?? null, userData.role)

  if (!allowManageProposals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Sem permissão para criar propostas</h2>
          <p className="text-neutral-600">Solicite acesso a um administrador.</p>
        </div>
      </div>
    )
  }

  return <ProposalForm />
}
