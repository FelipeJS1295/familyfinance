import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Crown, Home, Bell, Tag, LogOut, Plus, Trash2, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  familia_plus: 'Familia+',
}

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#3b82f6', '#06b6d4', '#84cc16', '#64748b',
]

const CATEGORY_ICONS = [
  '🛒', '💡', '🚗', '💊', '📚', '🎬', '🏠', '👕',
  '🍽️', '💸', '💼', '🎁', '💰', '✈️', '🏋️', '🐾',
  '🎮', '🎵', '📱', '🏦', '🔧', '🌿',
]

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('hogar')
  const [familyName, setFamilyName] = useState('')
  const [familySuccess, setFamilySuccess] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('💰')
  const [newCatColor, setNewCatColor] = useState('#6366f1')
  const [newCatIsIncome, setNewCatIsIncome] = useState(false)

  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/me')
      setFamilyName(res.data.name)
      return res.data
    },
  })

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/tenants/categories')
      return res.data
    },
  })

  const updateTenantMutation = useMutation({
    mutationFn: (name: string) => api.patch('/tenants/me', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
      setFamilySuccess('Nombre actualizado correctamente')
      setTimeout(() => setFamilySuccess(''), 3000)
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: () => api.post('/tenants/categories', {
      name: newCatName,
      icon: newCatIcon,
      color: newCatColor,
      is_income: newCatIsIncome,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setNewCatName('')
      setNewCatIcon('💰')
      setNewCatColor('#6366f1')
      setNewCatIsIncome(false)
      setShowCategoryForm(false)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  async function handleLogoutAll() {
    if (window.confirm('¿Cerrar sesión en todos los dispositivos?')) {
      try {
        await api.post('/auth/logout')
      } finally {
        clearAuth()
        navigate('/')
      }
    }
  }

  const tabs = [
    { id: 'hogar',         icon: Home,   label: 'Hogar'          },
    { id: 'categorias',    icon: Tag,    label: 'Categorías'      },
    { id: 'notificaciones',icon: Bell,   label: 'Notificaciones'  },
    { id: 'plan',          icon: Crown,  label: 'Plan'            },
    { id: 'sesion',        icon: LogOut, label: 'Sesión'          },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === id
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Hogar */}
      {activeTab === 'hogar' && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Nombre del hogar</h2>
            <p className="text-sm text-gray-400 mb-3">Este nombre lo verán todos los miembros</p>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="input mb-3"
              placeholder="Familia Pérez"
            />
            {familySuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-3">
                ✅ {familySuccess}
              </div>
            )}
            <button
              onClick={() => updateTenantMutation.mutate(familyName)}
              disabled={updateTenantMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateTenantMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="font-semibold text-gray-900 mb-1">Información del hogar</h2>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Plan actual</span>
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                  tenant?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                  tenant?.plan === 'pro' ? 'bg-primary-100 text-primary-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {PLAN_LABELS[tenant?.plan] ?? tenant?.plan}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Miembro desde</span>
                <span className="text-sm text-gray-700">
                  {tenant?.created_at
                    ? new Date(tenant.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Tu rol</span>
                <span className="text-sm text-gray-700 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Categorías */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Gestiona las categorías de tu hogar</p>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>

          {/* Formulario nueva categoría */}
          {showCategoryForm && (
            <div className="card border-2 border-primary-200">
              <h3 className="font-medium text-gray-900 mb-3">Nueva categoría</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej: Mascotas"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCatIsIncome(false)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        !newCatIsIncome ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      💸 Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatIsIncome(true)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        newCatIsIncome ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      💰 Ingreso
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Ícono</label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCatIcon(icon)}
                        className={`text-xl p-2 rounded-xl border-2 transition-all ${
                          newCatIcon === icon
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor: newCatColor === color ? '#1f2937' : 'transparent',
                          transform: newCatColor === color ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        {newCatColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => createCategoryMutation.mutate()}
                    disabled={!newCatName.trim() || createCategoryMutation.isPending}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    {createCategoryMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Crear categoría
                  </button>
                  <button
                    onClick={() => setShowCategoryForm(false)}
                    className="btn-secondary text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de categorías */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gastos</p>
            </div>
            {loadingCategories ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {categories?.filter((c: any) => !c.is_income).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: c.color + '20' }}
                      >
                        {c.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      {c.is_default && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    {!c.is_default && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta categoría?')) {
                            deleteCategoryMutation.mutate(c.id)
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-3 border-b border-t border-gray-50 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos</p>
            </div>
            <div className="divide-y divide-gray-50">
              {categories?.filter((c: any) => c.is_income).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: c.color + '20' }}
                    >
                      {c.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    {c.is_default && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  {!c.is_default && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Eliminar esta categoría?')) {
                          deleteCategoryMutation.mutate(c.id)
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notificaciones */}
      {activeTab === 'notificaciones' && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Notificaciones</h2>
            <p className="text-sm text-gray-400">Configura cómo quieres recibir alertas</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Resumen semanal</p>
                <p className="text-xs text-gray-400">Recibe un resumen cada lunes por correo</p>
              </div>
              <div className="bg-gray-100 text-gray-400 text-xs px-3 py-1 rounded-full">
                Próximamente
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Alertas de presupuesto</p>
                <p className="text-xs text-gray-400">Aviso cuando llegas al 80% del límite</p>
              </div>
              <div className="bg-gray-100 text-gray-400 text-xs px-3 py-1 rounded-full">
                Próximamente
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Alertas por WhatsApp</p>
                <p className="text-xs text-gray-400">Solo disponible en plan Familia+</p>
              </div>
              <div className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full">
                Familia+
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Plan */}
      {activeTab === 'plan' && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Tu plan actual</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mt-2 ${
              tenant?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
              tenant?.plan === 'pro' ? 'bg-primary-100 text-primary-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {tenant?.plan === 'pro' && '⭐'}
              {tenant?.plan === 'familia_plus' && '👑'}
              {PLAN_LABELS[tenant?.plan] ?? tenant?.plan}
            </div>
          </div>

          {tenant?.plan === 'free' && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p className="text-sm font-medium text-primary-800 mb-1">
                🚀 Actualiza a Pro por $7.990/mes
              </p>
              <p className="text-xs text-primary-600 mb-3">
                Hasta 6 miembros, movimientos ilimitados, importar CSV bancario y más.
              </p>
              <button
                onClick={() => navigate('/app/plans')}
                className="btn-primary text-sm py-2"
              >
                Ver todos los planes
              </button>
            </div>
          )}

          {tenant?.plan !== 'free' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">
                ✅ Tienes acceso completo
              </p>
              <p className="text-xs text-green-600">
                Para cambiar o cancelar tu plan contáctanos directamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Sesión */}
      {activeTab === 'sesion' && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Seguridad de sesión</h2>
            <p className="text-sm text-gray-400">Gestiona tus sesiones activas</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Sesión actual</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                Activa
              </span>
            </div>

            <button
              onClick={handleLogoutAll}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión en todos los dispositivos
            </button>

            <p className="text-xs text-gray-400 text-center">
              Esto cerrará la sesión en todos los dispositivos donde estés conectado.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}