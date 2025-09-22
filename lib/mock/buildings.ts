import { BuildingListItem, BuildingWithUnits, Unit } from '@/lib/types/building'

export const mockBuildings: BuildingListItem[] = [
  {
    id: 'bld-001',
    name: 'Residencial Jardim das Flores',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    totalUnits: 120,
    availableUnits: 45,
    reservedUnits: 30,
    soldUnits: 45,
    lastActivity: '2024-01-15'
  },
  {
    id: 'bld-002',
    name: 'Edifício Vista Mar',
    address: 'Av. Beira Mar, 456',
    city: 'Santos',
    state: 'SP',
    totalUnits: 80,
    availableUnits: 15,
    reservedUnits: 25,
    soldUnits: 40,
    lastActivity: '2024-01-14'
  },
  {
    id: 'bld-003',
    name: 'Condomínio Parque Verde',
    address: 'Rua do Parque, 789',
    city: 'Campinas',
    state: 'SP',
    totalUnits: 200,
    availableUnits: 80,
    reservedUnits: 50,
    soldUnits: 70,
    lastActivity: '2024-01-13'
  },
  {
    id: 'bld-004',
    name: 'Residencial Centro',
    address: 'Av. Central, 321',
    city: 'São Paulo',
    state: 'SP',
    totalUnits: 60,
    availableUnits: 5,
    reservedUnits: 10,
    soldUnits: 45,
    lastActivity: '2024-01-12'
  },
  {
    id: 'bld-005',
    name: 'Edifício Business Tower',
    address: 'Rua Comercial, 654',
    city: 'São Paulo',
    state: 'SP',
    totalUnits: 150,
    availableUnits: 60,
    reservedUnits: 35,
    soldUnits: 55,
    lastActivity: '2024-01-11'
  }
]

export const mockBuildingsWithUnits: BuildingWithUnits[] = [
  {
    id: 'bld-001',
    name: 'Residencial Jardim das Flores',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    totalUnits: 120,
    availableUnits: 45,
    reservedUnits: 30,
    soldUnits: 45,
    units: [
      {
        id: 'unit-001',
        buildingId: 'bld-001',
        number: '101',
        floor: '1',
        tower: 'A',
        status: 'livre',
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        price: 450000,
        proposalsCount: 0
      },
      {
        id: 'unit-002',
        buildingId: 'bld-001',
        number: '102',
        floor: '1',
        tower: 'A',
        status: 'reservado',
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        price: 450000,
        proposalsCount: 2,
        lastProposalDate: '2024-01-10'
      },
      {
        id: 'unit-003',
        buildingId: 'bld-001',
        number: '201',
        floor: '2',
        tower: 'A',
        status: 'vendido',
        area: 90,
        bedrooms: 3,
        bathrooms: 2,
        price: 480000,
        proposalsCount: 3,
        lastProposalDate: '2024-01-08'
      },
      {
        id: 'unit-004',
        buildingId: 'bld-001',
        number: '301',
        floor: '3',
        tower: 'A',
        status: 'livre',
        area: 90,
        bedrooms: 3,
        bathrooms: 2,
        price: 480000,
        proposalsCount: 1,
        lastProposalDate: '2024-01-05'
      }
    ]
  },
  {
    id: 'bld-002',
    name: 'Edifício Vista Mar',
    address: 'Av. Beira Mar, 456',
    city: 'Santos',
    state: 'SP',
    zipCode: '11000-000',
    totalUnits: 80,
    availableUnits: 15,
    reservedUnits: 25,
    soldUnits: 40,
    units: [
      {
        id: 'unit-005',
        buildingId: 'bld-002',
        number: '501',
        floor: '5',
        status: 'livre',
        area: 120,
        bedrooms: 3,
        bathrooms: 3,
        price: 650000,
        proposalsCount: 0
      },
      {
        id: 'unit-006',
        buildingId: 'bld-002',
        number: '502',
        floor: '5',
        status: 'reservado',
        area: 120,
        bedrooms: 3,
        bathrooms: 3,
        price: 650000,
        proposalsCount: 1,
        lastProposalDate: '2024-01-12'
      },
      {
        id: 'unit-007',
        buildingId: 'bld-002',
        number: '601',
        floor: '6',
        status: 'vendido',
        area: 130,
        bedrooms: 4,
        bathrooms: 3,
        price: 720000,
        proposalsCount: 2,
        lastProposalDate: '2024-01-09'
      }
    ]
  }
]
