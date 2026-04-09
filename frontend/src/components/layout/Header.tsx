import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const titles: Record<string, string> = {
  '/dashboard':    'Inicio',
  '/transactions': 'Movimientos',
  '/budgets':      'Presupuestos',
  '/goals':        'Metas de ahorro',
  '/settings':     'Configuración',
}

export default function Header() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const title = titles[location.pathname] ?? 'FamilyFinance'

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Buenos días' :
    hour < 19 ? 'Buenas tardes' :
                'Buenas noches'

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  )
}