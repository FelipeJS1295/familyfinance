import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Settings,
} from 'lucide-react'

const links = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Inicio'       },
  { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Movimientos'  },
  { to: '/app/budgets',      icon: PieChart,        label: 'Presupuestos' },
  { to: '/app/goals',        icon: Target,          label: 'Metas'        },
  { to: '/app/settings',     icon: Settings,        label: 'Más'          },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Copyright */}
      <div className="text-center pb-1">
        <p className="text-[10px] text-gray-300">
          © {new Date().getFullYear()} Budly · Creada por Felipe Silva · Todos los derechos reservados
        </p>
      </div>
    </nav>
  )
}