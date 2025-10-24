import { ProposalStatus } from '@/lib/types/proposal'

export type ProposalStatusVariant = 'warning' | 'success' | 'destructive' | 'outline'

export function getStatusBadgeVariant(status: ProposalStatus | string | undefined): ProposalStatusVariant {
  const normalizedStatus = normalizeStatus(status)
  
  switch (normalizedStatus) {
    case 'em_analise':
      return 'warning'
    case 'aprovada':
      return 'success'
    case 'negada':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function getStatusLabel(status: ProposalStatus | string | undefined): string {
  const normalizedStatus = normalizeStatus(status)
  
  switch (normalizedStatus) {
    case 'em_analise':
      return 'Em Análise'
    case 'aprovada':
      return 'Aprovada'
    case 'negada':
      return 'Negada'
    default:
      return status ? String(status) : 'N/A'
  }
}

function normalizeStatus(status: ProposalStatus | string | undefined): ProposalStatus {
  if (!status) return 'em_analise'
  
  const statusStr = String(status).toLowerCase().replace(/\s+/g, '_')
  
  switch (statusStr) {
    case 'em_analise':
    case 'em análise':
    case 'em_analise':
      return 'em_analise'
    case 'aprovada':
    case 'approved':
      return 'aprovada'
    case 'negada':
    case 'rejected':
    case 'denied':
      return 'negada'
    default:
      return 'em_analise'
  }
}
