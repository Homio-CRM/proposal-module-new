import { ProposalListItem, ProposalFormData } from '@/lib/types/proposal'

export const mockProposals: ProposalListItem[] = [
  {
    id: 'prop-001',
    title: 'Proposta Residencial Serra - 101',
    primaryContactName: 'João Silva',
    development: 'Residencial Serra',
    unit: '101',
    status: 'em_analise',
    proposalDate: '2024-01-15',
    price: 450000,
    assignedAgent: 'Maria Santos'
  },
  {
    id: 'prop-002',
    title: 'Jardins da Serra - 203',
    primaryContactName: 'Ana Costa',
    development: 'Jardins da Serra',
    unit: '203',
    status: 'aprovada',
    proposalDate: '2024-01-10',
    price: 380000,
    assignedAgent: 'Carlos Oliveira'
  },
  {
    id: 'prop-003',
    title: 'Torre Azul - 501',
    primaryContactName: 'Pedro Mendes',
    development: 'Torre Azul',
    unit: '501',
    status: 'negada',
    proposalDate: '2024-01-08',
    price: 520000,
    assignedAgent: 'Lucia Ferreira'
  },
  {
    id: 'prop-004',
    title: 'Condomínio Verde - 102',
    primaryContactName: 'Mariana Alves',
    development: 'Condomínio Verde',
    unit: '102',
    status: 'em_analise',
    proposalDate: '2024-01-12',
    price: 320000,
    assignedAgent: 'Roberto Lima'
  },
  {
    id: 'prop-005',
    title: 'Residencial Serra - 205',
    primaryContactName: 'Fernando Souza',
    development: 'Residencial Serra',
    unit: '205',
    status: 'aprovada',
    proposalDate: '2024-01-05',
    price: 480000,
    assignedAgent: 'Patricia Rocha'
  },
  {
    id: 'prop-006',
    title: 'Jardins da Serra - 401',
    primaryContactName: 'Camila Dias',
    development: 'Jardins da Serra',
    unit: '401',
    status: 'em_analise',
    proposalDate: '2024-01-18',
    price: 410000,
    assignedAgent: 'Antonio Silva'
  },
  {
    id: 'prop-007',
    title: 'Torre Azul - 302',
    primaryContactName: 'Ricardo Pereira',
    development: 'Torre Azul',
    unit: '302',
    status: 'negada',
    proposalDate: '2024-01-03',
    price: 550000,
    assignedAgent: 'Beatriz Costa'
  },
  {
    id: 'prop-008',
    title: 'Condomínio Verde - 301',
    primaryContactName: 'Juliana Martins',
    development: 'Condomínio Verde',
    unit: '301',
    status: 'aprovada',
    proposalDate: '2024-01-20',
    price: 360000,
    assignedAgent: 'Diego Santos'
  },
  {
    id: 'prop-009',
    title: 'Residencial Serra - 103',
    primaryContactName: 'Gabriel Oliveira',
    development: 'Residencial Serra',
    unit: '103',
    status: 'em_analise',
    proposalDate: '2024-01-22',
    price: 440000,
    assignedAgent: 'Larissa Mendes'
  },
  {
    id: 'prop-010',
    title: 'Jardins da Serra - 105',
    primaryContactName: 'Isabela Ferreira',
    development: 'Jardins da Serra',
    unit: '105',
    status: 'aprovada',
    proposalDate: '2024-01-14',
    price: 390000,
    assignedAgent: 'Thiago Alves'
  }
]

export const mockProposalDetails: Record<string, ProposalFormData> = {
  'prop-001': {
    proposal: {
      opportunityId: 'OPP-001',
      proposalDate: '2024-01-15',
      responsible: 'João Silva',
      proposalType: 'Venda',
      proposalStatus: 'Em Análise',
      priority: 'Alta',
      source: 'Site',
      externalReference: 'REF-001',
      validUntil: '2024-02-15',
      assignedAgent: 'Maria Santos'
    },
    primaryContact: {
      name: 'João Silva',
      cpf: '123.456.789-00',
      rg: '12.345.678-9',
      rgIssuer: 'SSP/SP',
      nationality: 'Brasileira',
      maritalStatus: 'Solteiro',
      birthDate: '1985-03-15',
      email: 'joao.silva@email.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123',
      zipCode: '01234-567',
      city: 'São Paulo',
      neighborhood: 'Centro',
      state: 'SP'
    },
    additionalContact: {
      name: 'Maria Silva',
      cpf: '987.654.321-00',
      rg: '98.765.432-1',
      rgIssuer: 'SSP/SP',
      nationality: 'Brasileira',
      maritalStatus: 'Casada',
      birthDate: '1987-07-20',
      email: 'maria.silva@email.com',
      phone: '(11) 88888-8888',
      address: 'Rua das Flores, 123',
      zipCode: '01234-567',
      city: 'São Paulo',
      neighborhood: 'Centro',
      state: 'SP'
    },
    property: {
      development: 'Residencial Serra',
      unit: '101',
      floor: '1',
      tower: 'A',
      reservedUntil: '2024-02-15',
      observations: 'Apartamento com vista para o jardim, próximo ao elevador social.'
    },
    installments: [
      {
        id: '1',
        condition: 'sinal',
        value: 45000,
        quantity: 1,
        date: '2024-01-20'
      },
      {
        id: '2',
        condition: 'mensais',
        value: 15000,
        quantity: 24,
        date: '2024-02-15'
      }
    ]
  },
  'prop-002': {
    proposal: {
      opportunityId: 'OPP-002',
      proposalDate: '2024-01-10',
      responsible: 'Ana Costa',
      proposalType: 'Venda',
      proposalStatus: 'Aprovada',
      priority: 'Média',
      source: 'Indicação',
      externalReference: 'REF-002',
      validUntil: '2024-02-10',
      assignedAgent: 'Carlos Oliveira'
    },
    primaryContact: {
      name: 'Ana Costa',
      cpf: '111.222.333-44',
      rg: '11.222.333-4',
      rgIssuer: 'SSP/SP',
      nationality: 'Brasileira',
      maritalStatus: 'Casada',
      birthDate: '1990-05-10',
      email: 'ana.costa@email.com',
      phone: '(11) 77777-7777',
      address: 'Av. Paulista, 1000',
      zipCode: '01310-100',
      city: 'São Paulo',
      neighborhood: 'Bela Vista',
      state: 'SP'
    },
    property: {
      development: 'Jardins da Serra',
      unit: '203',
      floor: '2',
      tower: 'B',
      reservedUntil: '2024-02-10',
      observations: 'Apartamento com 2 quartos, sacada ampla.'
    },
    installments: [
      {
        id: '1',
        condition: 'sinal',
        value: 38000,
        quantity: 1,
        date: '2024-01-15'
      },
      {
        id: '2',
        condition: 'mensais',
        value: 12000,
        quantity: 30,
        date: '2024-02-10'
      }
    ]
  },
  'prop-003': {
    proposal: {
      opportunityId: 'OPP-003',
      proposalDate: '2024-01-08',
      responsible: 'Pedro Mendes',
      proposalType: 'Venda',
      proposalStatus: 'Negada',
      priority: 'Baixa',
      source: 'Site',
      externalReference: 'REF-003',
      validUntil: '2024-02-08',
      assignedAgent: 'Lucia Ferreira'
    },
    primaryContact: {
      name: 'Pedro Mendes',
      cpf: '555.666.777-88',
      rg: '55.666.777-8',
      rgIssuer: 'SSP/SP',
      nationality: 'Brasileira',
      maritalStatus: 'Divorciado',
      birthDate: '1978-12-03',
      email: 'pedro.mendes@email.com',
      phone: '(11) 66666-6666',
      address: 'Rua Augusta, 500',
      zipCode: '01305-000',
      city: 'São Paulo',
      neighborhood: 'Consolação',
      state: 'SP'
    },
    property: {
      development: 'Torre Azul',
      unit: '501',
      floor: '5',
      tower: 'C',
      reservedUntil: '2024-02-08',
      observations: 'Apartamento de cobertura com terraço privativo.'
    },
    installments: [
      {
        id: '1',
        condition: 'sinal',
        value: 52000,
        quantity: 1,
        date: '2024-01-12'
      },
      {
        id: '2',
        condition: 'semestrais',
        value: 78000,
        quantity: 6,
        date: '2024-07-12'
      }
    ]
  }
}
