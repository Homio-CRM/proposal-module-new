import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BackButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function BackButton({ href, children, className = '' }: BackButtonProps) {
  return (
    <Link href={href}>
      <button 
        className={`flex items-center justify-start px-0 py-2 text-neutral-700 font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer ${className}`}
        onMouseEnter={(e) => {
          const computedStyle = getComputedStyle(document.documentElement)
          const primaryColor = computedStyle.getPropertyValue('--color-primary-600') || computedStyle.getPropertyValue('--tw-color-primary-600')
          if (primaryColor) {
            e.currentTarget.style.color = primaryColor
          } else {
            // Fallback para pegar a cor do tema atual
            const testEl = document.createElement('div')
            testEl.className = 'text-primary-600'
            testEl.style.visibility = 'hidden'
            document.body.appendChild(testEl)
            const color = getComputedStyle(testEl).color
            document.body.removeChild(testEl)
            e.currentTarget.style.color = color
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = ''
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {children}
      </button>
    </Link>
  )
}
