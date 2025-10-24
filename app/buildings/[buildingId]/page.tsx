'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BuildingDetails } from '@/components/BuildingDetails'
import { buildingService } from '@/lib/services/buildingService'
import { BuildingWithUnits, UnitStatus } from '@/lib/types/building'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function BuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userData, loading, error } = useUserDataContext()
  const [building, setBuilding] = useState<BuildingWithUnits | null>(null)
  const [buildingLoading, setBuildingLoading] = useState(true)
  const [buildingError, setBuildingError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'all'>('all')
  
  const buildingId = params.buildingId as string

  useEffect(() => {
    const fetchBuilding = async () => {
      if (!userData?.activeLocation || !buildingId) return;
      
      setBuildingLoading(true);
      setBuildingError(null);
      
      try {
        const data = await buildingService.fetchBuildingWithUnits(buildingId, userData.activeLocation);
        setBuilding(data);
      } catch (err) {
        setBuildingError(err instanceof Error ? err.message : 'Erro ao carregar empreendimento');
      } finally {
        setBuildingLoading(false);
      }
    };

    fetchBuilding();
  }, [buildingId, userData?.activeLocation]);

  if (loading || buildingLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || buildingError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">Erro: {error || buildingError}</p>
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

  if (!building) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/buildings')}
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
                Empreendimento não encontrado
              </h2>
              <p className="text-gray-600">
                O empreendimento solicitado não foi encontrado.
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
                onClick={() => router.push('/buildings')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {building.name}
                </h1>
                <p className="text-gray-600">
                  {building.city}, {building.state}
                </p>
              </div>
            </div>
          </div>

          {/* Building Details */}
          <BuildingDetails building={building} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
        </div>
      </div>
    </div>
  )
}