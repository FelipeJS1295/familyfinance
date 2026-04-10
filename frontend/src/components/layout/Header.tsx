import { useLocation } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const titles: Record<string, string> = {
  '/dashboard':    'Inicio',
  '/transactions': 'Movimientos',
  '/budgets':      'Presupuestos',
  '/goals':        'Metas',
  '/settings':     'Configuración',
  '/members':      'Miembros',
}

export default function Header() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const title = titles[location.pathname] ?? 'Budly'

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Logo solo en móvil */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
        </div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>

        {/* Avatar en móvil */}
        <div
          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: user?.avatar_color ?? '#6366f1' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}