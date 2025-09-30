'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CustomFieldIds {
  opportunityFields: Record<string, string>  // "empreendimento" -> "customFieldId"
  contactFields: Record<string, string>    // "cpf" -> "customFieldId"
}

interface FieldMapping {
  formField: string  // Campo do formulário (ex: "empreendimento")
  customFieldId: string  // ID do custom field
  customFieldName: string  // Nome do custom field
}

interface CustomFieldsContextType {
  customFieldIds: CustomFieldIds
  setCustomFieldIds: (ids: CustomFieldIds) => void
  getCustomFieldId: (section: 'opportunityFields' | 'contactFields', field: string, configData?: any) => string | null
  getFieldMapping: (section: 'opportunityFields' | 'contactFields', field: string) => FieldMapping | null
  getAllMappings: () => { opportunityFields: FieldMapping[], contactFields: FieldMapping[] }
}

const CustomFieldsContext = createContext<CustomFieldsContextType | undefined>(undefined)

interface CustomFieldsProviderProps {
  children: ReactNode
}

export function CustomFieldsProvider({ children }: CustomFieldsProviderProps) {
  const [customFieldIds, setCustomFieldIdsState] = useState<CustomFieldIds>({
    opportunityFields: {},
    contactFields: {}
  })

  const setCustomFieldIds = (ids: CustomFieldIds) => {
    setCustomFieldIdsState(ids)
  }

  const getCustomFieldId = (section: 'opportunityFields' | 'contactFields', field: string, configData?: any): string | null => {
    const fieldIds = customFieldIds[section]
    
    if (configData) {
      const configValue = section === 'opportunityFields' 
        ? configData.opportunityFields[field]
        : configData.contactFields[field]
      
      if (configValue && configValue.trim()) {
        // Busca pelo valor da config (ex: "responsavel" -> ID)
        return fieldIds[configValue] || null
      }
    }
    
    // Se não tem configData ou configValue vazio, retorna null
    return null
  }

  const getFieldMapping = (section: 'opportunityFields' | 'contactFields', field: string): FieldMapping | null => {
    const fieldIds = customFieldIds[section]
    const customFieldId = fieldIds[field]
    
    if (customFieldId) {
      return {
        formField: field,
        customFieldId: customFieldId,
        customFieldName: field // Por enquanto, usar o nome do campo como nome do custom field
      }
    }
    
    return null
  }

  const getAllMappings = () => {
    const opportunityMappings: FieldMapping[] = []
    const contactMappings: FieldMapping[] = []

    // Mapear opportunity fields
    Object.entries(customFieldIds.opportunityFields).forEach(([field, customFieldId]) => {
      const mapping = {
        formField: field,
        customFieldId: customFieldId,
        customFieldName: field
      }
      opportunityMappings.push(mapping)
    })

    // Mapear contact fields
    Object.entries(customFieldIds.contactFields).forEach(([field, customFieldId]) => {
      const mapping = {
        formField: field,
        customFieldId: customFieldId,
        customFieldName: field
      }
      contactMappings.push(mapping)
    })

    return {
      opportunityFields: opportunityMappings,
      contactFields: contactMappings
    }
  }

  return (
    <CustomFieldsContext.Provider value={{
      customFieldIds,
      setCustomFieldIds,
      getCustomFieldId,
      getFieldMapping,
      getAllMappings
    }}>
      {children}
    </CustomFieldsContext.Provider>
  )
}

export function useCustomFieldsContext() {
  const context = useContext(CustomFieldsContext)
  if (context === undefined) {
    throw new Error('useCustomFieldsContext must be used within a CustomFieldsProvider')
  }
  return context
}
