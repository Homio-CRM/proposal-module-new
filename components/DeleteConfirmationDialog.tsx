'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  itemName: string
  itemType: 'unidade' | 'empreendimento'
}

export default function DeleteConfirmationDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  itemName, 
  itemType 
}: DeleteConfirmationDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setDeleting(true)
    setError('')
    
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao deletar ${itemType}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-2">
                  Esta ação não pode ser desfeita.
                </p>
                <p className="text-red-700">
                  {itemType === 'empreendimento' 
                    ? 'Todas as unidades, propostas e contatos relacionados serão deletados permanentemente.'
                    : 'Todas as propostas e contatos relacionados a esta unidade serão deletados permanentemente.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>{itemType === 'empreendimento' ? 'Empreendimento' : 'Unidade'}:</strong> {itemName}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deletando...' : `Sim, deletar ${itemType}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

