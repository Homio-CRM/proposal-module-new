# Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GHL System Configuration
GHL_APP_SHARED_SECRET=your_shared_secret
```

## Como obter as credenciais do Supabase:

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em Settings > API
4. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Configuração da tabela profiles no Supabase:

Execute o seguinte SQL no editor SQL do Supabase:

```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    agency_id TEXT,
    ghl_user_id TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Configuração do GHL_APP_SHARED_SECRET:

Esta chave deve ser a mesma usada no sistema GoHighLevel para criptografar os dados do usuário.
