'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, AlertCircle, Loader2 } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { getSupabase } from '@/lib/supabaseClient'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface BuildingFormData {
  name: string
  address: string
  city: string
  state: string
}

export default function BuildingForm() {
  const { userData, loading: userLoading } = useUserDataContext()
  const router = useRouter()
  const [formData, setFormData] = useState<BuildingFormData>({
    name: '',
    address: '',
    city: '',
    state: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (field: keyof BuildingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do empreendimento é obrigatório'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Endereço é obrigatório'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório'
    } else if (formData.state.trim().length !== 2) {
      newErrors.state = 'Estado deve ter 2 caracteres (ex: SP)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!userData?.activeLocation) {
      setErrorMessage('Usuário não autenticado ou sem localização ativa')
      setShowErrorDialog(true)
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = await getSupabase()

      const { data, error } = await supabase
        .from('buildings')
        .insert({
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          agency_id: userData.activeLocation
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Invalida cache da listagem de empreendimentos para esta agency
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${userData.activeLocation}`)

      setShowSuccessDialog(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao criar empreendimento')
      setShowErrorDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push('/buildings')
  }

  if (showSuccessDialog) {
    setTimeout(() => {
      if (showSuccessDialog) {
        handleSuccessClose()
      }
    }, 3000)
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Acesso Negado
              </h2>
              <p className="text-gray-600 mb-4">
                Você precisa estar autenticado para criar um empreendimento.
              </p>
              <Button onClick={() => router.push('/buildings')}>
                Voltar para Empreendimentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <BackButton href="/buildings">
            Voltar para Empreendimentos
          </BackButton>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Novo Empreendimento
              </h1>
              <p className="text-gray-600">
                Preencha os dados do empreendimento
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Empreendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Empreendimento *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Residencial Jardim das Flores"
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço *
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Ex: Rua das Flores, 123"
                  className={errors.address ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className={errors.city ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF) *
                  </label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="Ex: SP"
                    maxLength={2}
                    className={errors.state ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600 mt-1">{errors.state}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/buildings')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Empreendimento'
              )}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Building2 className="h-5 w-5" />
              Empreendimento Criado!
            </DialogTitle>
            <DialogDescription>
              O empreendimento foi criado com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={handleSuccessClose}>
              Voltar para Empreendimentos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Criar Empreendimento
            </DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 