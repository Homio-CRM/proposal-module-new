export type UnitStatus = 'livre' | 'reservado' | 'vendido'
export type UnitStatusDB = 'available' | 'reserved' | 'sold'

export interface Building {
  id: string
  name: string
  address: string
  city: string
  state: string
  agency_id: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  building_id: string
  number: string
  floor: string
  tower: string
  name: string
  status: UnitStatus
  agency_id: string
  created_at: string
  updated_at: string
}

export interface BuildingWithUnits extends Building {
  units: Unit[]
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
}

export interface BuildingFilters {
  search: string
  city: string
  status: UnitStatus | 'all'
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
}
