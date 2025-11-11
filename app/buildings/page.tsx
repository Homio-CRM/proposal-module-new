'use client'

import { useState, useMemo, useEffect } from 'react'
import { useUserDataContext } from "@/lib/contexts/UserDataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingsFiltersSidebar } from "@/components/BuildingsFiltersSidebar";
import { BuildingsTable } from "@/components/BuildingsTable";
import { BuildingFilters, BuildingListItem } from "@/lib/types/building";
import { buildingService } from "@/lib/services/buildingService";
import { Plus, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { usePreferencesContext } from "@/lib/contexts/PreferencesContext";
import { canManageBuildings as canManageBuildingsPermission, canViewBuildings as canViewBuildingsPermission } from "@/lib/utils/permissions";

export default function BuildingsPage() {
  const { userData, loading, error } = useUserDataContext();
  const { preferences, loading: preferencesLoading } = usePreferencesContext();
  const [buildings, setBuildings] = useState<BuildingListItem[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BuildingFilters>({
    search: '',
    city: '',
    status: 'all'
  });
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);

  const userRole = userData?.role ?? 'user';
  const allowViewBuildings = canViewBuildingsPermission(preferences ?? null, userRole);
  const allowManageBuildings = canManageBuildingsPermission(preferences ?? null, userRole);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!userData?.activeLocation || !allowViewBuildings) {
        setBuildings([]);
        setBuildingsLoading(false);
        return;
      }
      
      setBuildingsLoading(true);
      setBuildingsError(null);
      
      try {
        const data = await buildingService.fetchBuildingsListData(userData.activeLocation);
        setBuildings(data);
      } catch (err) {
        setBuildingsError(err instanceof Error ? err.message : 'Erro ao carregar empreendimentos');
      } finally {
        setBuildingsLoading(false);
      }
    };

    if (!preferencesLoading) {
      fetchBuildings();
    }
  }, [userData?.activeLocation, allowViewBuildings, preferencesLoading]);

  const filteredBuildings = useMemo(() => {
    return buildings
      .filter((building: BuildingListItem) => {
        const matchesSearch = !filters.search || 
          building.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          building.address.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchesCity = !filters.city || 
          building.city === filters.city;
        
        const matchesStatus = filters.status === 'all' || 
          (filters.status === 'livre' && building.availableUnits > 0) ||
          (filters.status === 'reservado' && building.reservedUnits > 0) ||
          (filters.status === 'vendido' && building.soldUnits > 0);

        return matchesSearch && matchesCity && matchesStatus;
      });
  }, [buildings, filters]);

  const handleFiltersChange = (newFilters: BuildingFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      city: '',
      status: 'all'
    });
  };


  const handleSelectBuilding = (id: string, selected: boolean) => {
    if (selected) {
      if (!allowManageBuildings) return;
      setSelectedBuildings(prev => [...prev, id]);
    } else {
      setSelectedBuildings(prev => prev.filter(buildingId => buildingId !== id));
    }
  };

  const handleSelectAll = () => {
    if (!allowManageBuildings) return;
    if (selectedBuildings.length === filteredBuildings.length) {
      setSelectedBuildings([]);
    } else {
      setSelectedBuildings(filteredBuildings.map(building => building.id));
    }
  };

  const handleBulkDelete = () => {
    if (!allowManageBuildings) return;
    if (selectedBuildings.length > 0) {
      setSelectedBuildings([]);
    }
  };

  if (loading || buildingsLoading || preferencesLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex min-w-0">
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
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-3 w-10"><Skeleton className="h-4 w-4 mx-auto" /></th>
                        <th className="px-2 py-3 min-w-[200px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 min-w-[150px]"><Skeleton className="h-4 w-12" /></th>
                        <th className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-16" /></th>
                        <th className="px-2 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-3 w-10"><Skeleton className="h-4 w-4 mx-auto" /></td>
                          <td className="px-2 py-3 min-w-[200px]">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </td>
                          <td className="px-2 py-3 min-w-[150px]"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-8" /></td>
                          <td className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-8" /></td>
                          <td className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-8" /></td>
                          <td className="px-2 py-3 min-w-[100px]"><Skeleton className="h-4 w-8" /></td>
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

  if (error || buildingsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">Erro: {error || buildingsError}</p>
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

  if (!allowViewBuildings && !preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Sem permissão para visualizar empreendimentos</h2>
          <p className="text-neutral-600">Solicite acesso a um administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-w-0">
        <BuildingsFiltersSidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          buildings={buildings}
        />

        <div className="flex-1 p-6 overflow-visible min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Empreendimentos</h2>
              <p className="text-neutral-600">Gerencie seus empreendimentos e unidades</p>
            </div>
            <div className="flex items-center gap-3">
              {allowManageBuildings && (
                <Link href="/buildings/create">
                  <Button variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Empreendimento
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

          {allowManageBuildings && selectedBuildings.length > 0 && (
            <div className="flex items-center justify-end mb-6">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados ({selectedBuildings.length})
              </Button>
            </div>
          )}

          <BuildingsTable
            buildings={filteredBuildings}
            selectedBuildings={selectedBuildings}
            onSelectBuilding={handleSelectBuilding}
            onSelectAll={handleSelectAll}
            canManage={allowManageBuildings}
          />

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
            <span>
              Mostrando 1 a {filteredBuildings.length} de {filteredBuildings.length} empreendimentos
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
