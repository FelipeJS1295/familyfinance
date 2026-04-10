import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function NotFoundPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">

        {/* Ilustración */}
        <div className="text-8xl mb-6">🏠</div>

        {/* Texto */}
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Esta página no existe
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          La página que buscas no existe o fue movida. 
          No te preocupes, tus finanzas están bien guardadas.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary px-6 py-3"
          >
            ← Volver atrás
          </button>
          {token ? (
            <Link to="/app/dashboard" className="btn-primary px-6 py-3">
              Ir al inicio
            </Link>
          ) : (
            <Link to="/" className="btn-primary px-6 py-3">
              Ir al inicio
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}