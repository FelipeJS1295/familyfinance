import { useQuery } from '@tanstack/react-query'
import { Loader2, Users, Crown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  familia_plus: 'Familia+',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  member: 'Miembro',
  child: 'Hijo',
  superadmin: 'Super Admin',
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/me')
      return res.data
    },
  })

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/tenants/members')
      return res.data
    },
  })

  if (loadingTenant || loadingMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Info del hogar */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Tu hogar</h2>
            <p className="text-sm text-gray-400">Información general</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-50">
            <span className="text-sm text-gray-500">Nombre del hogar</span>
            <span className="text-sm font-medium text-gray-900">{tenant?.name}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-50">
            <span className="text-sm text-gray-500">Plan actual</span>
            <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
              tenant?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
              tenant?.plan === 'pro' ? 'bg-primary-100 text-primary-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {PLAN_LABELS[tenant?.plan] ?? tenant?.plan}
            </span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm text-gray-500">Miembro desde</span>
            <span className="text-sm font-medium text-gray-900">
              {tenant?.created_at
                ? new Date(tenant.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })
                : '—'}
            </span>
          </div>
        </div>

        {tenant?.plan === 'free' && (
          <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm font-medium text-primary-800 mb-1">
              🚀 Actualiza a Pro por $4.990/mes
            </p>
            <p className="text-xs text-primary-600 mb-3">
              Importa CSV bancario, gastos recurrentes, resumen semanal y más.
            </p>
            <button className="btn-primary text-sm py-2">
              Ver planes
            </button>
          </div>
        )}
      </div>

      {/* Tu perfil */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: user?.avatar_color ?? '#6366f1' }}
          >
            {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-50">
            <span className="text-sm text-gray-500">Rol en el hogar</span>
            <span className="text-sm font-medium text-gray-900">
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Miembros */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Miembros del hogar</h2>
            <p className="text-sm text-gray-400">{members?.length ?? 0} personas</p>
          </div>
        </div>

        <div className="space-y-3">
          {members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: m.avatar_color ?? '#6366f1' }}
                >
                  {m.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}