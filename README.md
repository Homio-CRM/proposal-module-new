# 🏗️ Homio Modules Base

Este é o template base para todos os módulos da agência Homio. Um projeto Next.js 15 com TypeScript, Supabase, autenticação integrada e sistema de permissões.

## 🚀 Tecnologias Incluídas

- **Next.js 15** com App Router e Turbopack
- **TypeScript** para tipagem estática
- **Supabase** para backend e autenticação
- **Tailwind CSS 4** para estilização
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones
- **ESLint** configurado para Next.js
- **Sistema de permissões** baseado em roles
- **Context API** para gerenciamento de estado
- **Criptografia** para dados sensíveis

## 📋 Pré-requisitos

- Node.js 18+ 
- npm, yarn, pnpm ou bun
- Conta no Supabase
- Acesso ao sistema Homio (para chave SSO)

## 🛠️ Como Clonar e Configurar

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd modules-base
```

### 2. Instale as Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as Variáveis de Ambiente

**⚠️ IMPORTANTE:** Consulte o arquivo [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) para instruções detalhadas sobre como configurar todas as variáveis de ambiente necessárias.

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id

# Homio System Configuration (Chave SSO para Decrypt)
HOMIO_APP_SHARED_SECRET=your_shared_secret
```

### 4. Configure o Supabase

Execute o arquivo SQL em `supabase/queries/01_create_profiles_table.sql` no editor SQL do Supabase para criar a estrutura de dados necessária.

### 5. Execute o Projeto

```bash
npm run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
modules-base/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   │   ├── auth/          # Rotas de autenticação
│   │   └── decrypt-user-data/ # Descriptografia de dados
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes de UI base
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── auth/             # Serviços de autenticação
│   ├── cache/            # Sistema de cache
│   ├── config/           # Configurações do app
│   ├── contexts/         # Context providers
│   ├── types/            # Definições de tipos TypeScript
│   └── utils/            # Funções utilitárias
├── supabase/             # Queries e configurações do Supabase
└── public/               # Arquivos estáticos
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia o servidor de produção
npm run lint         # Executa o linter
npm run generate-types # Gera tipos TypeScript do Supabase
```

## 🎯 Funcionalidades Base

### Autenticação
- Integração com Supabase Auth
- Sistema de login/logout
- Proteção de rotas
- Gerenciamento de sessão

### Sistema de Permissões
- Roles baseados em usuário
- Middleware de autorização
- Componentes condicionais por permissão

### Gerenciamento de Estado
- Context API para dados do usuário
- Cache local para performance
- Hooks customizados

### UI/UX
- Design system com Tailwind CSS
- Componentes acessíveis com Radix UI
- Loading states e skeletons
- Responsive design

## 🔐 Segurança

- Criptografia de dados sensíveis
- Row Level Security (RLS) no Supabase
- Validação de tipos com TypeScript
- Sanitização de inputs
- Headers de segurança

## 📱 Responsividade

O template é totalmente responsivo e otimizado para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🛠️ Customização

### Adicionando Novos Componentes

1. Crie o componente em `components/ui/`
2. Exporte no `components/ui/index.ts`
3. Use o sistema de variantes com `class-variance-authority`

### Adicionando Novas Rotas

1. Crie a pasta em `app/`
2. Adicione `page.tsx` para rotas públicas
3. Use middleware para proteção de rotas privadas

### Adicionando Novos Tipos

1. Defina os tipos em `lib/types/`
2. Exporte no `lib/types/index.ts`
3. Use em todo o projeto com importação centralizada

## 📚 Documentação Adicional

- [Configuração de Ambiente](./ENVIRONMENT_SETUP.md) - Guia completo de configuração
- [GoHighLevel API Documentation](https://marketplace.gohighlevel.com/docs/oauth/GettingStarted/index.html) - Documentação oficial da API GHL
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🆘 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação
2. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ pela equipe Homio**
