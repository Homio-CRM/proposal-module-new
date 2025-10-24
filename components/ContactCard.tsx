import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactSkeleton } from '@/components/skeletons/ContactSkeleton'
import { useContactData } from '@/hooks/useContactData'
import { User, UserPlus } from 'lucide-react'
import type { ContactData } from '@/lib/types/proposal'

interface ContactCardProps {
  title: string
  icon: 'primary' | 'additional'
  contactId: string | null
  locationId: string
  fallbackData: ContactData
}

export function ContactCard({ title, icon, contactId, locationId, fallbackData }: ContactCardProps) {
  const { contactData, loading, error } = useContactData(contactId, locationId)
  
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '—'
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '—'
      }
      return date.toLocaleDateString('pt-BR')
    } catch {
      return '—'
    }
  }

  const formatField = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') {
      return '—'
    }
    if (typeof value === 'string' && value.trim() === '') {
      return '—'
    }
    return String(value)
  }

  const handleContactClick = () => {
    const homioId = displayData.homioId || fallbackData.homioId
    if (homioId) {
      const url = `https://app.homio.com.br/v2/location/${locationId}/contacts/detail/${homioId}`
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return <ContactSkeleton title={title} />
  }

  const displayData = contactData || fallbackData
  const IconComponent = icon === 'primary' ? User : UserPlus

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <button
            onClick={handleContactClick}
            className={`flex items-center gap-2 transition-colors ${
              (displayData.homioId || fallbackData.homioId)
                ? 'hover:text-primary-700 cursor-pointer' 
                : 'cursor-default opacity-50'
            }`}
            disabled={!(displayData.homioId || fallbackData.homioId)}
            title={(displayData.homioId || fallbackData.homioId) ? `Abrir ${title.toLowerCase()} no Homio` : `ID do ${title.toLowerCase()} não disponível`}
          >
            <IconComponent className="h-5 w-5 text-primary-600" />
            {title}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Dados básicos carregados. Alguns campos podem estar incompletos.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <p className="text-sm text-gray-900">{formatField(displayData.name)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">CPF</label>
            <p className="text-sm text-gray-900">{formatField(displayData.cpf)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">RG</label>
            <p className="text-sm text-gray-900">{formatField(displayData.rg)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nacionalidade</label>
            <p className="text-sm text-gray-900">{formatField(displayData.nationality)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Estado Civil</label>
            <p className="text-sm text-gray-900">{formatField(displayData.maritalStatus)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
            <p className="text-sm text-gray-900">{formatDate(displayData.birthDate)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">E-mail</label>
            <p className="text-sm text-gray-900">{formatField(displayData.email)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <p className="text-sm text-gray-900">{formatField(displayData.phone)}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Endereço</label>
            <p className="text-sm text-gray-900">{formatField(displayData.address)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">CEP</label>
            <p className="text-sm text-gray-900">{formatField(displayData.zipCode)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cidade</label>
            <p className="text-sm text-gray-900">{formatField(displayData.city)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Bairro</label>
            <p className="text-sm text-gray-900">{formatField(displayData.neighborhood)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <p className="text-sm text-gray-900">{formatField(displayData.state)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
