# Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id

# Homio System Configuration (Chave SSO para Decrypt)
HOMIO_APP_SHARED_SECRET=your_shared_secret
```

## 🔑 Configuração da Chave SSO (HOMIO_APP_SHARED_SECRET)

A variável `HOMIO_APP_SHARED_SECRET` é a **chave SSO** usada para descriptografar os dados do usuário que vêm do sistema Homio.

### Como obter a chave SSO:

1. **No sistema Homio**, vá para as configurações da sua aplicação
2. **Localize a seção de SSO** ou configurações de integração
3. **Copie a chave compartilhada** (shared secret) que é usada para criptografar os dados
4. **Cole no arquivo `.env.local`** como valor da variável `HOMIO_APP_SHARED_SECRET`

### ⚠️ Importante:
- Esta chave deve ser **exatamente a mesma** usada no sistema Homio
- Mantenha esta chave **secreta** e não a compartilhe
- Em produção, use variáveis de ambiente seguras do seu provedor de hospedagem

## Como obter as credenciais do Supabase:

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em Settings > API
4. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
   - `Project ID` → `SUPABASE_PROJECT_ID`

## Configuração da tabela profiles no Supabase:

Execute o arquivo SQL localizado em `supabase/queries/01_create_profiles_table.sql` no editor SQL do Supabase.

Este arquivo inclui:
- Criação do enum `profile_roles`
- Criação da tabela `profiles` com todas as colunas necessárias
- Índices para performance
- Row Level Security (RLS) habilitado
- Políticas de segurança
- Trigger para atualização automática do `updated_at`

## Configuração do HOMIO_APP_SHARED_SECRET:

Esta chave deve ser a mesma usada no sistema Homio para criptografar os dados do usuário.
