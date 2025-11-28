'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useUserDataContext } from "@/lib/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProposalFiltersSidebar } from "@/components/ProposalFiltersSidebar";
import { ProposalTable } from "@/components/ProposalTable";
import { ProposalFilters, ProposalListItem } from "@/lib/types/proposal";
import { dataService } from "@/lib/services/dataService";
import { usePreferencesContext } from "@/lib/contexts/PreferencesContext";
import { canManageProposals as canManageProposalsPermission, canViewProposals as canViewProposalsPermission, restrictProposalsToCreator } from "@/lib/utils/permissions";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";

export default function ProposalsPage() {
  const { userData, loading, error } = useUserDataContext();
  const { preferences, loading: preferencesLoading } = usePreferencesContext();
  const pathname = usePathname();
  const [filters, setFilters] = useState<ProposalFilters>({
    search: '',
    development: '',
    unit: '',
    status: 'all',
    createdBy: 'all'
  });
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string | null }>>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userRole = userData?.role ?? 'user';
  const allowViewProposals = canViewProposalsPermission(preferences ?? null, userRole);
  const allowManageProposals = canManageProposalsPermission(preferences ?? null, userRole);
  const restrictToCreator = restrictProposalsToCreator(preferences ?? null, userRole) ? userData?.userId : undefined;
  const showCreatedByFilter = !restrictToCreator;
  const developmentOptions = useMemo(() => {
    const set = new Set<string>([''])
    proposals.forEach(p => {
      if (p.development) set.add(p.development)
    })
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map(value => ({ value, label: value || 'Selecione o empreendimento...' }))
  }, [proposals])

  const unitOptions = useMemo(() => {
    const set = new Set<string>([''])
    proposals.forEach(p => {
      if (p.unit) set.add(p.unit)
    })
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map(value => ({ value, label: value || 'Selecione a unidade...' }))
  }, [proposals])

  const loadProposals = useCallback(async () => {
    if (!userData?.companyId || !allowViewProposals) {
      setProposals([]);
      setProfiles([]);
      setProposalsLoading(false);
      return;
    }
    
    try {
      setProposalsLoading(true);
      const restrictOptions = restrictToCreator ? { restrictToUserId: restrictToCreator } : undefined;
      const [proposalsData, profilesData] = await Promise.all([
        dataService.fetchProposalsData(
          userData.companyId,
          restrictOptions ?? {}
        ),
        restrictToCreator
          ? Promise.resolve([
              {
                id: userData.userId,
                name: userData.userName ?? null
              }
            ])
          : dataService.fetchProfilesWithProposals(userData.companyId)
      ]);
      setProposals(proposalsData);
      setProfiles(profilesData);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
    } finally {
      setProposalsLoading(false);
    }
  }, [userData?.companyId, allowViewProposals, restrictToCreator, userData?.userId, userData?.userName]);

  useEffect(() => {
    if (userData && !loading && !preferencesLoading) {
      loadProposals();
    }
  }, [userData, loading, preferencesLoading, loadProposals, restrictToCreator]);

  const prevPathnameRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (pathname === '/proposals' && userData?.companyId && !loading && !preferencesLoading) {
      const prevPathname = prevPathnameRef.current;
      
      if (prevPathname !== pathname && prevPathname !== null) {
        dataService.clearProposalsCache(
          userData.companyId,
          restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
        );
        loadProposals();
      }
      
      prevPathnameRef.current = pathname;
    }
  }, [pathname, userData?.companyId, loading, preferencesLoading, loadProposals, restrictToCreator]);

  useEffect(() => {
    const handleFocus = () => {
      if (userData?.companyId && !loading && !preferencesLoading) {
        dataService.clearProposalsCache(
          userData.companyId,
          restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
        );
        loadProposals();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [userData?.companyId, loading, preferencesLoading, loadProposals, restrictToCreator]);

  const filteredProposals = useMemo(() => {
    return proposals
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

        const matchesCreatedBy = filters.createdBy === 'all' || 
          (Array.isArray(filters.createdBy) && filters.createdBy.length > 0 && proposal.createdBy && filters.createdBy.includes(proposal.createdBy));

        return matchesSearch && matchesDevelopment && matchesUnit && matchesStatus && matchesCreatedBy;
      })
      .sort((a, b) => {
        return new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime();
      });
  }, [proposals, filters]);

  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProposals.slice(startIndex, endIndex);
  }, [filteredProposals, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProposals.length / itemsPerPage);
  }, [filteredProposals.length]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleFiltersChange = (newFilters: ProposalFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      development: '',
      unit: '',
      status: 'all',
      createdBy: 'all'
    });
  };

  const handleCopy = async (proposalId: string) => {
    if (!userData?.companyId || !allowManageProposals) return;
    
    try {
      const proposalDetails = await dataService.fetchProposalDetails(
        proposalId,
        restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
      );

      if (!proposalDetails) {
        return;
      }

      const { proposalFormData } = proposalDetails;
      const originalName = proposalFormData.proposal.proposalName || 'Proposta sem nome';
      const newName = `Cópia de ${originalName}`;

      if (!proposalFormData.proposal.opportunityId) {
        return;
      }

      if (!proposalFormData.property.unitId) {
        return;
      }

      const supabase = await import('@/lib/supabaseClient').then(m => m.getSupabase());
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const installmentsPayload = proposalFormData.installments.map(installment => {
        const basePayload = {
          type: installment.condition,
          amountPerInstallment: installment.value,
          installmentsCount: installment.quantity,
          totalAmount: installment.value * installment.quantity
        };

        if (installment.condition === 'intermediarias' && installment.dates && installment.dates.length > 0) {
          return {
            ...basePayload,
            dates: installment.dates
          };
        } else if (installment.date) {
          return {
            ...basePayload,
            startDate: installment.date
          };
        }
        return basePayload;
      });

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          agencyId: userData.activeLocation,
          opportunityId: proposalFormData.proposal.opportunityId,
          proposalDate: proposalFormData.proposal.proposalDate,
          proposalName: newName,
          responsible: proposalFormData.proposal.responsible,
          reservedUntil: proposalFormData.property.reservedUntil || undefined,
          shouldReserveUnit: proposalFormData.property.shouldReserveUnit || false,
          unitId: proposalFormData.property.unitId,
          primaryContact: {
            homioId: proposalFormData.primaryContact.homioId,
            name: proposalFormData.primaryContact.name
          },
          secondaryContact: proposalFormData.additionalContact ? {
            homioId: proposalFormData.additionalContact.homioId,
            name: proposalFormData.additionalContact.name
          } : null,
          installments: installmentsPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao duplicar proposta');
      }

      dataService.clearProposalsCache(
        userData.companyId,
        restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
      );
      await loadProposals();
    } catch (error) {
      console.error('Erro ao duplicar proposta:', error);
    }
  };

  const handleDeleteClick = (proposalId: string) => {
    setProposalToDelete(proposalId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!proposalToDelete || !userData?.companyId || !allowManageProposals) return;
    
    try {
      await dataService.deleteProposal(
        proposalToDelete,
        restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
      );
      
      dataService.clearProposalsCache(
        userData.companyId,
        restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
      );
      const proposalsData = await dataService.fetchProposalsData(
        userData.companyId,
        restrictToCreator ? { restrictToUserId: restrictToCreator } : {}
      );
      setProposals(proposalsData);
      
      setDeleteDialogOpen(false);
      setProposalToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar proposta:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProposalToDelete(null);
  };

  const handleView = () => {};

  if (loading || proposalsLoading || preferencesLoading) {
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

  if (!allowViewProposals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <h2 className="text-xl font-semibold text-neutral-900">Sem permissão para visualizar propostas</h2>
          <p className="text-neutral-600">Entre em contato com um administrador para solicitar acesso.</p>
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
          developmentOptions={developmentOptions}
          unitOptions={unitOptions}
          profiles={profiles}
          allowCreatedByFilter={showCreatedByFilter}
        />

        <div className="flex-1 p-6 overflow-visible min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Propostas</h2>
              <p className="text-neutral-600">Gerencie suas propostas imobiliárias</p>
            </div>
            <div className="flex items-center gap-3">
              {allowManageProposals && (
                <Link href="/proposals/create">
                  <Button variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Proposta
                  </Button>
                </Link>
              )}
              {userRole === 'admin' && (
                <Link href="/config">
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <ProposalTable
            proposals={paginatedProposals}
            onCopy={handleCopy}
            onDelete={handleDeleteClick}
            onView={handleView}
            canManage={allowManageProposals}
          />

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={handleDeleteCancel}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
            <span>
              {filteredProposals.length > 0 ? (
                <>
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredProposals.length)} de {filteredProposals.length} propostas
                </>
              ) : (
                'Nenhuma proposta encontrada'
              )}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary-600 text-white border-primary-600" : ""}
                  >
                    {page}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
