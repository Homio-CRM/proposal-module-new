export type UnitStatus = 'livre' | 'reservado' | 'vendido' | 'outro'

export interface Building {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
}

export interface Unit {
  id: string
  buildingId: string
  number: string
  floor: string
  tower?: string
  status: UnitStatus
  area?: number
  bedrooms?: number
  bathrooms?: number
  price?: number
  proposalsCount: number
  lastProposalDate?: string
}

export interface BuildingWithUnits extends Building {
  units: Unit[]
}

export interface BuildingFilters {
  search: string
  city: string
  status: UnitStatus | 'all'
  minPrice?: number
  maxPrice?: number
}

export interface BuildingListItem {
  id: string
  name: string
  address: string
  city: string
  state: string
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
  lastActivity?: string
}
