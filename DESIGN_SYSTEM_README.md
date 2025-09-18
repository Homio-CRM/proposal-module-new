# Sistema de Design - Base Modules

Este projeto inclui um sistema de design completo e reutilizável para todos os módulos da agência GHL.

## 🎨 Sistema de Cores

### Cores Principais
- **Primary**: Azul (para ações principais, botões primários)
- **Secondary**: Cinza (para elementos secundários, backgrounds)
- **Accent**: Vermelho (para alertas, ações destrutivas)
- **Neutral**: Cinza neutro (para textos, bordas, elementos neutros)

### Como Usar as Cores

#### 1. Via CSS Variables
```css
.custom-element {
  background-color: var(--primary-500);
  color: var(--primary-50);
}
```

#### 2. Via Tailwind Classes
```tsx
<div className="bg-primary-500 text-primary-50">
  Conteúdo com cores primárias
</div>
```

#### 3. Via Configuração TypeScript
```tsx
import { colorConfig } from '@/lib/config/colors';

// Acessar valores programaticamente
const primaryColor = colorConfig.primary[500];
```

## 🧩 Componentes Disponíveis

### Button
Componente de botão com múltiplas variantes:
- `default`: Botão primário
- `secondary`: Botão secundário
- `outline`: Botão com borda
- `destructive`: Botão de ação destrutiva
- `ghost`: Botão transparente
- `link`: Botão como link

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Clique aqui
</Button>
```

### Skeleton
Componente para loading states:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-4 w-[250px]" />
```

## 🛠️ Customização

### Alterando Cores
1. Edite o arquivo `lib/config/colors.ts`
2. Atualize as variáveis CSS em `app/globals.css`
3. Reinicie o servidor de desenvolvimento

### Adicionando Novas Cores
1. Adicione a nova paleta em `lib/config/colors.ts`
2. Adicione as variáveis CSS em `app/globals.css`
3. Atualize o `tailwind.config.ts`

## 📦 Dependências Instaladas

- `class-variance-authority`: Para variantes de componentes
- `clsx`: Para manipulação de classes CSS
- `tailwind-merge`: Para merge inteligente de classes Tailwind
- `lucide-react`: Para ícones
- `@radix-ui/react-slot`: Para composição de componentes
- `react-loading-skeleton`: Para estados de loading

## 🚀 Como Usar em Novos Projetos

1. Clone este repositório base
2. Copie os arquivos de configuração:
   - `lib/config/colors.ts`
   - `lib/utils/cn.ts`
   - `tailwind.config.ts`
   - `components.json`
3. Copie a pasta `components/ui/`
4. Instale as dependências listadas acima
5. Personalize as cores conforme necessário

## 🎯 Exemplo de Uso

Veja o componente `ThemeExamples` em `lib/config/theme-examples.tsx` para exemplos práticos de como usar o sistema de design.

## 📝 Notas Importantes

- Todas as cores seguem a escala 50-950 do Tailwind CSS
- As cores são responsivas e funcionam com dark mode
- O sistema é totalmente customizável sem quebrar a consistência
- Todos os componentes seguem os padrões de acessibilidade
