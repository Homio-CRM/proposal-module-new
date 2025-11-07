'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomDatePicker } from '@/components/ui/date-picker'
import { parseISODateToLocal } from '@/lib/utils/date'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Calculator,
  AlertCircle
} from 'lucide-react'
import type { PaymentInstallment, PaymentCondition } from '@/lib/types/proposal'

interface PaymentInstallmentsStepProps {
  data: PaymentInstallment[]
  onDataChange: (data: PaymentInstallment[]) => void
  errors?: Record<string, string>
}

const PAYMENT_CONDITIONS: { value: PaymentCondition; label: string }[] = [
  { value: 'sinal', label: 'Sinal' },
  { value: 'parcela_unica', label: 'Parcela única' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'mensais', label: 'Mensais' },
  { value: 'intermediarias', label: 'Intermediárias' },
  { value: 'anuais', label: 'Anuais' },
  { value: 'semestrais', label: 'Semestrais' },
  { value: 'bimestrais', label: 'Bimestrais' },
  { value: 'trimestrais', label: 'Trimestrais' }
]

const generateId = () => Math.random().toString(36).substr(2, 9)

export default function PaymentInstallmentsStep({ 
  data, 
  onDataChange,
  errors = {}
}: PaymentInstallmentsStepProps) {
  const [installments, setInstallments] = useState<PaymentInstallment[]>(data)
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    setInstallments(data)
  }, [data])


  const addInstallment = () => {
    const newInstallment: PaymentInstallment = {
      id: generateId(),
      condition: 'sinal',
      value: 0,
      quantity: 1,
      date: ''
    }
    
    const updatedInstallments = [...installments, newInstallment]
    setInstallments(updatedInstallments)
    onDataChange(updatedInstallments)
  }

  const removeInstallment = (id: string) => {
    const updatedInstallments = installments.filter(installment => installment.id !== id)
    setInstallments(updatedInstallments)
    onDataChange(updatedInstallments)
    
    // Remove errors for this installment
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`${id}-`)) {
        delete newErrors[key]
      }
    })
  }

  const updateInstallment = (id: string, field: keyof PaymentInstallment, value: string | number) => {
    const updatedInstallments = installments.map(installment => 
      installment.id === id 
        ? { ...installment, [field]: value }
        : installment
    )
    setInstallments(updatedInstallments)
    onDataChange(updatedInstallments)
    
    // Clear error for this field
    const errorKey = `${id}-${field}`
    if (errors[errorKey]) {
      const newErrors = { ...errors }
      delete newErrors[errorKey]
    }
  }

  const calculateTotal = (): number => {
    return installments.reduce((total, installment) => {
      return total + (installment.value * installment.quantity)
    }, 0)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newInstallments = [...installments]
    const draggedItem = newInstallments[draggedIndex]
    
    // Remove o item da posição original
    newInstallments.splice(draggedIndex, 1)
    
    // Insere o item na nova posição
    newInstallments.splice(dropIndex, 0, draggedItem)
    
    setInstallments(newInstallments)
    onDataChange(newInstallments)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }


  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">Parcelas de Pagamento</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Configure as parcelas de pagamento da proposta
          </p>
        </div>
        <Button
          onClick={addInstallment}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Parcela</span>
        </Button>
      </div>

      {/* Error Message */}
      {errors['installments'] && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{errors['installments']}</p>
          </div>
        </div>
      )}

      {/* Installments List */}
      {installments.length > 0 ? (
        <div className="space-y-4">
          {installments.map((installment, index) => (
            <Card 
              key={installment.id}
              className={`border transition-all duration-200 ${
                draggedIndex === index 
                  ? 'opacity-50 scale-95 border-primary-300 shadow-lg' 
                  : dragOverIndex === index && draggedIndex !== index
                  ? 'border-primary-400 shadow-md'
                  : 'border-neutral-200'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center cursor-move">
                      <GripVertical className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-neutral-900">Parcela {index + 1}</CardTitle>
                      <CardDescription>
                        Configure os detalhes desta parcela
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeInstallment(installment.id)}
                    className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Condição *
                    </label>
                    <Select
                      value={installment.condition}
                      onChange={(e) => updateInstallment(installment.id, 'condition', e.target.value as PaymentCondition)}
                      className={errors[`${installment.id}-condition`] ? 'border-accent-500' : ''}
                    >
                      {PAYMENT_CONDITIONS.map(condition => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </Select>
                    {errors[`${installment.id}-condition`] && (
                      <p className="text-sm text-accent-600 mt-1">
                        {errors[`${installment.id}-condition`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Valor da Parcela *
                    </label>
                    <Input
                      type="number"
                      value={installment.value || ''}
                      onChange={(e) => updateInstallment(installment.id, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      className={errors[`${installment.id}-value`] ? 'border-accent-500' : ''}
                    />
                    {errors[`${installment.id}-value`] && (
                      <p className="text-sm text-accent-600 mt-1">
                        {errors[`${installment.id}-value`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Quantidade *
                    </label>
                    <Input
                      type="number"
                      value={installment.quantity || ''}
                      onChange={(e) => updateInstallment(installment.id, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="1"
                      min="1"
                      className={errors[`${installment.id}-quantity`] ? 'border-accent-500' : ''}
                    />
                    {errors[`${installment.id}-quantity`] && (
                      <p className="text-sm text-accent-600 mt-1">
                        {errors[`${installment.id}-quantity`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Data *
                    </label>
                    <CustomDatePicker
                      value={parseISODateToLocal(installment.date)}
                      onChange={(date) => updateInstallment(installment.id, 'date', date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Selecione a data"
                      minDate={new Date()}
                      error={!!errors[`${installment.id}-date`]}
                    />
                    {errors[`${installment.id}-date`] && (
                      <p className="text-sm text-accent-600 mt-1">
                        {errors[`${installment.id}-date`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subtotal for this installment */}
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">
                      Subtotal desta parcela:
                    </span>
                    <span className="text-sm font-semibold text-primary-600">
                      {formatCurrency(installment.value * installment.quantity)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
          <Calculator className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Nenhuma parcela adicionada
          </h3>
            <p className="text-neutral-600 mb-4">
              Clique em &quot;Adicionar Parcela&quot; para começar a configurar o pagamento
            </p>
          <Button
            onClick={addInstallment}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeira Parcela
          </Button>
        </div>
      )}

      {/* Total Summary */}
      {installments.length > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calculator className="h-6 w-6 text-primary-600" />
                <div>
                  <h4 className="text-lg font-semibold text-primary-900">
                    Valor Total da Proposta
                  </h4>
                  <p className="text-sm text-primary-700">
                    Soma de todas as parcelas configuradas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-900">
                  {formatCurrency(calculateTotal())}
                </div>
                <div className="text-sm text-primary-700">
                  {installments.length} parcela{installments.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}