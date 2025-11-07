'use client'

import { useState } from 'react'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { useOpportunityData } from '@/hooks/useOpportunityData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OpportunityData, ContactData } from '@/lib/services/opportunityService'

export default function TestMappingPage() {
  const { customFieldIds, getAllMappings } = useCustomFieldsContext()
  const { loadOpportunityData, loading, error } = useOpportunityData()
  const [opportunityId, setOpportunityId] = useState('')
  const [mappedData, setMappedData] = useState<{
    opportunity: OpportunityData;
    contact: ContactData | null;
    opportunityFormData: Record<string, string | number | boolean | null>;
    contactFormData: Record<string, string | number | boolean | null>;
  } | null>(null)
  const [mappings, setMappings] = useState<ReturnType<typeof getAllMappings> | null>(null)

  const handleTestMapping = async () => {
    if (!opportunityId.trim()) {
      alert('Digite um ID de oportunidade')
      return
    }

    try {
      const result = await loadOpportunityData(opportunityId)
      setMappedData(result)
    } catch (err) {
      console.error('Erro no teste:', err)
    }
  }

  const handleTestMappings = () => {
    setMappings(getAllMappings())
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Mapeamento de Custom Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ID da Oportunidade</label>
            <Input
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              placeholder="Digite o ID da oportunidade"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleTestMapping} disabled={loading}>
              {loading ? 'Carregando...' : 'Testar Mapeamento'}
            </Button>
            <Button onClick={handleTestMappings} variant="outline">
              Ver Mapeamentos
            </Button>
          </div>

          {error && (
            <div className="text-red-600">
              <p>Erro: {error}</p>
            </div>
          )}
          {mappings && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Mapeamentos de Oportunidade:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappings.opportunityFields, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Mapeamentos de Contato:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappings.contactFields, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {mappedData && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Mapeamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Dados da Oportunidade:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappedData.opportunity, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Dados do Contato:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappedData.contact, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Formulário Opportunity:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappedData.opportunityFormData, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Formulário Contact:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(mappedData.contactFormData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custom Field IDs Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Opportunity Fields:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(customFieldIds.opportunityFields, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Contact Fields:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(customFieldIds.contactFields, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
