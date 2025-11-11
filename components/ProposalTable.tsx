'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ProposalListItem } from '@/lib/types/proposal'
import { getStatusBadgeVariant, getStatusLabel } from '@/lib/utils/proposalStatus'
import { Copy, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProposalTableProps {
  proposals: ProposalListItem[]
  onCopy: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  selectedProposals: string[]
  onSelectProposal: (id: string, selected: boolean) => void
  onSelectAll: () => void
  onBulkDelete: () => void
  showUnitColumn?: boolean
  canManage?: boolean
}

export function ProposalTable({ 
  proposals, 
  onCopy, 
  onDelete, 
  onView, 
  selectedProposals, 
  onSelectProposal, 
  onSelectAll, 
  onBulkDelete,
  showUnitColumn = true,
  canManage = true
}: ProposalTableProps) {
  const router = useRouter()
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }


  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {canManage && selectedProposals.length > 0 && (
        <div className="flex justify-end p-3 border-b border-gray-200">
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Selecionadas ({selectedProposals.length})
          </Button>
        </div>
      )}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {canManage && (
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <Checkbox
                    checked={proposals.length > 0 && proposals.every(proposal => selectedProposals.includes(proposal.id))}
                    onCheckedChange={onSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
              )}
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Título
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                Status
              </th>
              {showUnitColumn && (
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Unidade
                </th>
              )}
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                Contato Principal
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                Data
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Valor Total
              </th>
              {canManage && (
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {proposals.map((proposal, index) => (
              <tr 
                key={proposal.id} 
                className={`group cursor-pointer transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-100`}
                onClick={() => {
                  onView(proposal.id)
                  router.push(`/proposals/${proposal.id}`)
                }}
              >
                {canManage && (
                  <td className="px-2 py-3 whitespace-nowrap w-10">
                    <Checkbox
                      checked={selectedProposals.includes(proposal.id)}
                      onCheckedChange={(checked) => {
                        onSelectProposal(proposal.id, checked as boolean)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${proposal.title}`}
                    />
                  </td>
                )}
                <td className="px-2 py-3 whitespace-nowrap min-w-[180px]">
                  <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors duration-150">
                    {proposal.title}
                  </div>
                  <div className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors duration-150">
                    Oportunidade: {proposal.opportunityId || 'N/A'}
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap min-w-[90px]">
                  <Badge variant={getStatusBadgeVariant(proposal.status)}>
                    {getStatusLabel(proposal.status)}
                  </Badge>
                </td>
                {showUnitColumn && (
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-900 min-w-[140px]">
                    {proposal.unit && proposal.development 
                      ? `${proposal.unit} - ${proposal.development}`
                      : proposal.development || proposal.unit || 'N/A'
                    }
                  </td>
                )}
                <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-900 min-w-[110px]">
                  {proposal.primaryContactName}
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-900 min-w-[90px]">
                  {formatDate(proposal.proposalDate)}
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-neutral-900 min-w-[100px]">
                  {formatPrice(proposal.price)}
                </td>
                {canManage && (
                  <td className="px-2 py-3 whitespace-nowrap text-center w-24">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCopy(proposal.id)
                        }}
                        className="h-7 w-7 p-0 border-transparent hover:bg-primary-50 hover:border-primary-300"
                      >
                        <Copy className="h-3 w-3 text-primary-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(proposal.id)
                        }}
                        className="h-7 w-7 p-0 border-transparent hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
