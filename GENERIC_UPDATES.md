# Atualizações para Sistema Genérico

## ✅ Alterações Realizadas

### 1. **Sistema de Permissões Genérico**
- **Antes**: Permissões específicas como `canCreateListing`, `canEditListing`, etc.
- **Agora**: Permissões genéricas que podem ser aplicadas a qualquer módulo:
  - `canCreate` - Criar novos registros
  - `canRead` - Visualizar dados
  - `canUpdate` - Editar registros existentes
  - `canDelete` - Deletar registros
  - `canManageUsers` - Gerenciar usuários
  - `canManageSettings` - Gerenciar configurações
  - `canExportData` - Exportar dados
  - `canImportData` - Importar dados

### 2. **Dados Mockados Genéricos**
- **Antes**: Dados específicos do projeto original
- **Agora**: Dados genéricos que podem ser usados em qualquer módulo:
  ```typescript
  {
    userId: "mock_user_id_123",
    companyId: "mock_company_id_456",
    role: "admin",
    type: "agency",
    activeLocation: "mock_location_id_789",
    userName: "Mock User",
    email: "mock.user@example.com"
  }
  ```

### 3. **Estrutura SQL Completa**
- **Criado**: `supabase/queries/01_create_profiles_table.sql`
- **Inclui**:
  - Enum `profile_roles` para tipos de usuário
  - Tabela `profiles` com todas as colunas necessárias
  - Índices para performance
  - Row Level Security (RLS) habilitado
  - Políticas de segurança
  - Trigger para atualização automática do `updated_at`

### 4. **Documentação da Chave SSO**
- **Adicionado**: Explicação detalhada sobre `HOMIO_APP_SHARED_SECRET`
- **Localização**: Variável de ambiente no arquivo `.env.local`
- **Uso**: Chave para descriptografar dados do Homio

## 🔧 Como Usar as Permissões Genéricas

### Exemplo de Uso:
```typescript
import { serverHasPermission } from '@/lib/utils/permissions'

// Verificar se pode criar algo
const canCreate = serverHasPermission(userData.role, 'canCreate')

// Verificar se pode deletar
const canDelete = serverHasPermission(userData.role, 'canDelete')

// Verificar se pode gerenciar usuários
const canManageUsers = serverHasPermission(userData.role, 'canManageUsers')
```

### Aplicação em Diferentes Módulos:
- **Módulo de Listagens**: `canCreate` = criar listagem, `canDelete` = deletar listagem
- **Módulo de Usuários**: `canCreate` = criar usuário, `canManageUsers` = gerenciar usuários
- **Módulo de Relatórios**: `canExportData` = exportar relatórios, `canRead` = visualizar dados

## 📁 Estrutura de Arquivos Atualizada

```
supabase/
├── README.md                           # Documentação da pasta supabase
└── queries/
    └── 01_create_profiles_table.sql    # SQL completo para criar tabela

lib/types/
└── roles.ts                            # Permissões genéricas atualizadas

hooks/
└── useUserData.ts                      # Dados mockados genéricos

app/api/
└── decrypt-user-data/
    └── route.ts                        # Dados mockados genéricos
```

## 🎯 Benefícios das Alterações

1. **Reutilização**: Sistema pode ser clonado para qualquer módulo Homio
2. **Flexibilidade**: Permissões genéricas se adaptam a diferentes funcionalidades
3. **Manutenibilidade**: Código mais limpo e fácil de manter
4. **Segurança**: RLS e políticas de segurança implementadas
5. **Performance**: Índices otimizados para consultas rápidas

## 🚀 Próximos Passos

1. **Configure as variáveis de ambiente** (veja `ENVIRONMENT_SETUP.md`)
2. **Execute o SQL** em `supabase/queries/01_create_profiles_table.sql`
3. **Teste o sistema** com `npm run dev`
4. **Clone o projeto** para criar novos módulos
5. **Adapte as permissões** conforme necessário para cada módulo específico

O sistema agora está **100% genérico** e pronto para ser usado como base para qualquer módulo da agência Homio! 🎉
