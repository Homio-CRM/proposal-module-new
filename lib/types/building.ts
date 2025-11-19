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

export interface MonthlyAdjustmentRate {
  id: string
  unit_id: string
  year: number
  january_rate: number
  february_rate: number
  march_rate: number
  april_rate: number
  may_rate: number
  june_rate: number
  july_rate: number
  august_rate: number
  september_rate: number
  october_rate: number
  november_rate: number
  december_rate: number
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
  gross_price_amount: number
  price_correction_rate: number
  bedroom_count: number
  private_area: number
  garden_area: number
  total_area: number
  parking_space_count: number
  current_value: number
  monthly_adjustment_rates: MonthlyAdjustmentRate[]
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
