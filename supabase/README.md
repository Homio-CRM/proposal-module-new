# Supabase Queries

Esta pasta contém os arquivos SQL necessários para configurar o banco de dados Supabase.

## Arquivos Disponíveis

### `queries/01_create_profiles_table.sql`
Script completo para criar a tabela `profiles` com:
- Enum `profile_roles` para tipos de usuário
- Tabela `profiles` com todas as colunas necessárias
- Índices para otimização de performance
- Row Level Security (RLS) habilitado
- Políticas de segurança para proteção de dados
- Trigger para atualização automática do campo `updated_at`

## Como Usar

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Copie e cole o conteúdo** do arquivo `01_create_profiles_table.sql`
4. **Execute o script**

## Estrutura da Tabela

```sql
CREATE TABLE public.profiles (
    id UUID NOT NULL,                    -- Referência para auth.users
    agency_id TEXT NOT NULL,             -- ID da agência
    homio_user_id TEXT NULL,             -- ID do usuário no Homio
    email TEXT NULL,                     -- Email do usuário
    role public.profile_roles NULL,      -- Role (admin/user)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);
```

## Segurança

- **Row Level Security (RLS)** habilitado
- **Políticas de segurança** configuradas para que usuários só vejam seus próprios dados
- **Foreign key constraint** com cascade delete para manter integridade
- **Índices** para otimizar consultas por agency_id, homio_user_id, email e role
