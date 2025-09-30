'use client'

import { useAutoCustomFields } from '@/hooks/useAutoCustomFields'

export function AutoCustomFieldsLoader() {
  useAutoCustomFields()
  return null // Este componente não renderiza nada, apenas executa o hook
}
