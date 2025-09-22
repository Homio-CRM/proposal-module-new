'use client'

import { useState, useMemo } from 'react'
import { useUserDataContext } from "@/lib/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalFiltersSidebar } from "@/components/ProposalFiltersSidebar";
import { ProposalTable } from "@/components/ProposalTable";
import { ProposalFilters } from "@/lib/types/proposal";
import { mockProposals } from "@/lib/mock/proposals";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ProposalsPage() {
  const { userData, loading, error } = useUserDataContext();
  const [filters, setFilters] = useState<ProposalFilters>({
    search: '',
    development: '',
    unit: '',
    status: 'all'
  });
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  const filteredProposals = useMemo(() => {
    return mockProposals
      .filter(proposal => {
        const matchesSearch = !filters.search || 
          proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          proposal.primaryContactName.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchesDevelopment = !filters.development || 
          proposal.development === filters.development;
        
        const matchesUnit = !filters.unit || 
          proposal.unit === filters.unit;
        
        const matchesStatus = filters.status === 'all' || 
          proposal.status === filters.status;

        return matchesSearch && matchesDevelopment && matchesUnit && matchesStatus;
      })
      .sort((a, b) => {
        // Ordenar por data da proposta (mais recente primeiro)
        return new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime();
      });
  }, [filters]);

  const handleFiltersChange = (newFilters: ProposalFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      development: '',
      unit: '',
      status: 'all'
    });
  };

  const handleCopy = () => {};

  const handleDelete = () => {};

  const handleView = () => {};

  const handleSelectProposal = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedProposals(prev => [...prev, id]);
    } else {
      setSelectedProposals(prev => prev.filter(proposalId => proposalId !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedProposals.length === filteredProposals.length) {
      setSelectedProposals([]);
    } else {
      setSelectedProposals(filteredProposals.map(proposal => proposal.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProposals.length > 0) {
      // TODO: Implementar exclusão em massa
      console.log('Deletando propostas:', selectedProposals);
      setSelectedProposals([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex min-w-0">
          {/* Sidebar Skeleton */}
          <div className="w-[320px] flex-shrink-0 border-r-2 border-gray-300 bg-white">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-28" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Table Skeleton */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-3 w-10"><Skeleton className="h-4 w-4 mx-auto" /></th>
                        <th className="px-2 py-3 min-w-[180px]"><Skeleton className="h-4 w-12" /></th>
                        <th className="px-2 py-3 min-w-[90px]"><Skeleton className="h-4 w-12" /></th>
                        <th className="px-2 py-3 min-w-[140px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 min-w-[110px]"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-2 py-3 min-w-[90px]"><Skeleton className="h-4 w-8" /></th>
                        <th className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-3 w-10"><Skeleton className="h-4 w-4 mx-auto" /></td>
                          <td className="px-2 py-3 min-w-[180px]">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </td>
                          <td className="px-2 py-3 min-w-[90px]"><Skeleton className="h-6 w-16" /></td>
                          <td className="px-2 py-3 min-w-[140px]"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-2 py-3 min-w-[110px]"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-2 py-3 min-w-[90px]"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-2 py-3 w-12"><Skeleton className="h-7 w-7 mx-auto" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">Erro: {error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <p className="text-neutral-600">Usuário não autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-w-0">
        <ProposalFiltersSidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        <div className="flex-1 p-6 overflow-visible min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Propostas</h2>
              <p className="text-neutral-600">Gerencie suas propostas imobiliárias</p>
            </div>
            <Link href="/proposals/create">
              <Button variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Proposta
              </Button>
            </Link>
          </div>

          {selectedProposals.length > 0 && (
            <div className="flex items-center justify-end mb-6">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionadas ({selectedProposals.length})
              </Button>
            </div>
          )}

          <ProposalTable
            proposals={filteredProposals}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onView={handleView}
            selectedProposals={selectedProposals}
            onSelectProposal={handleSelectProposal}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
          />

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
            <span>
              Mostrando 1 a {filteredProposals.length} de {filteredProposals.length} propostas
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" className="bg-primary-600 text-white border-primary-600">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
