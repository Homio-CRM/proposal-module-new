# Sistema de Autenticação - Modules Base

Este projeto implementa um sistema de autenticação robusto usando **Supabase** como backend, com as seguintes características principais:

- **Autenticação automática** de usuários via API externa (GoHighLevel)
- **Criação/atualização automática** de usuários no Supabase
- **Sistema de cache** para otimizar performance
- **Gerenciamento de sessões** com refresh automático
- **Sistema de permissões** baseado em roles
- **Modo desenvolvimento** com dados mockados

## Estrutura de Arquivos

```
lib/
├── auth/
│   └── authService.ts          # Serviço principal de autenticação
├── cache/
│   └── userCache.ts            # Sistema de cache em memória
├── config/
│   └── performance.ts          # Configurações de performance
├── contexts/
│   └── UserDataContext.tsx     # Context React para dados do usuário
├── types/
│   ├── core.ts                 # Tipos principais
│   ├── roles.ts                # Sistema de permissões
│   ├── common.ts               # Tipos comuns
│   └── index.ts                # Exportações
├── utils/
│   └── permissions.ts          # Utilitários de permissões
└── supabaseClient.ts           # Cliente Supabase

hooks/
└── useUserData.ts              # Hook para gerenciar dados do usuário

app/api/
├── auth/
│   └── login/
│       └── route.ts            # API de login
└── decrypt-user-data/
    └── route.ts                # API de decrypt de dados
```

## Como Usar

### 1. Configuração Inicial

1. Configure as variáveis de ambiente (veja `ENVIRONMENT_SETUP.md`)
2. Execute o SQL para criar a tabela `profiles` no Supabase
3. Execute `npm run dev`

### 2. Uso no Frontend

```typescript
import { useUserDataContext } from '@/lib/contexts/UserDataContext'

function MyComponent() {
    const { userData, loading, error } = useUserDataContext()
    
    if (loading) return <div>Carregando...</div>
    if (error) return <div>Erro: {error}</div>
    if (!userData) return <div>Usuário não autenticado</div>
    
    return <div>Bem-vindo, {userData.userName}!</div>
}
```

### 3. Verificação de Permissões

```typescript
import { serverHasPermission } from '@/lib/utils/permissions'

// Verificar se usuário tem permissão específica
const canDelete = serverHasPermission(userData.role, 'canDelete')

// Obter todas as permissões do usuário
const permissions = serverGetUserPermissions(userData.role)
```

## Fluxo de Autenticação

1. **Usuário acessa a aplicação**
2. **Hook useUserData** verifica cache
3. **Se não há cache**, chama API de decrypt para obter dados do usuário
4. **AuthService** inicializa sessão via `/api/auth/login`
5. **API cria/atualiza** usuário no Supabase
6. **API retorna tokens** de sessão
7. **AuthService** configura sessão no Supabase
8. **Dados são salvos** no cache e localStorage
9. **Usuário fica autenticado** e pode usar a aplicação

## Modo Desenvolvimento

Em modo desenvolvimento (`NODE_ENV === 'development'`), o sistema usa dados mockados genéricos:

```typescript
const mockData: UserData = {
    userId: "mock_user_id_123",
    companyId: "mock_company_id_456",
    role: "admin",
    type: "agency",
    activeLocation: "mock_location_id_789",
    userName: "Mock User",
    email: "mock.user@example.com"
}
```

## Sistema de Cache

O sistema implementa cache em memória com TTL configurável:

- **USER_SESSION**: 15 minutos
- **USER_PROFILE**: 10 minutos
- **LISTINGS**: 5 minutos
- **CONDOMINIUMS**: 5 minutos
- **MEDIA_ITEMS**: 10 minutos

## Sistema de Permissões

### Roles Disponíveis:
- **admin**: Acesso total a todas as funcionalidades
- **user**: Acesso limitado a funcionalidades básicas

### Permissões Genéricas:
- `canCreate` - Criar novos registros
- `canRead` - Visualizar dados
- `canUpdate` - Editar registros existentes
- `canDelete` - Deletar registros
- `canManageUsers` - Gerenciar usuários
- `canManageSettings` - Gerenciar configurações
- `canExportData` - Exportar dados
- `canImportData` - Importar dados

## APIs Disponíveis

### POST /api/auth/login
Autentica usuário e retorna tokens de sessão.

**Body:**
```json
{
    "userId": "string",
    "companyId": "string",
    "role": "admin" | "user",
    "type": "string",
    "activeLocation": "string",
    "userName": "string",
    "email": "string"
}
```

### POST /api/decrypt-user-data
Decripta dados do usuário vindos do sistema externo.

**Body:**
```json
{
    "encryptedData": "string"
}
```

## Troubleshooting

### Erro de Sessão Inválida
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se a tabela `profiles` existe no Supabase
- Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está correto

### Erro de Decrypt
- Verifique se `HOMIO_APP_SHARED_SECRET` está configurado
- Confirme se a chave é a mesma usada no sistema externo

### Cache não funcionando
- Verifique se o `userCache` está sendo importado corretamente
- Confirme se as chaves de cache estão sendo usadas consistentemente
