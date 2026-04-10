import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar solo en desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Navegación inferior solo en móvil */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}