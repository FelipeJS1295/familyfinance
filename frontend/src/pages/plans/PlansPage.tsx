import { useQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Para empezar a ordenar tus finanzas',
    color: 'border-gray-200',
    badge: '',
    features: [
      { text: '1 miembro en el hogar', included: true },
      { text: '15 movimientos por mes', included: true },
      { text: '2 metas de ahorro', included: true },
      { text: '1 presupuesto por categoría', included: true },
      { text: 'Dashboard básico', included: true },
      { text: 'Invitar miembros', included: false },
      { text: 'Importar CSV bancario', included: false },
      { text: 'Resumen semanal por correo', included: false },
      { text: 'Gastos recurrentes', included: false },
      { text: 'Alertas por WhatsApp', included: false },
      { text: 'Exportar PDF', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7990,
    description: 'Para familias que quieren control total',
    color: 'border-primary-500',
    badge: 'Más popular',
    features: [
      { text: 'Hasta 6 miembros en el hogar', included: true },
      { text: 'Movimientos ilimitados', included: true },
      { text: 'Metas de ahorro ilimitadas', included: true },
      { text: 'Presupuestos ilimitados', included: true },
      { text: 'Dashboard completo', included: true },
      { text: 'Invitar miembros con código', included: true },
      { text: 'Importar CSV bancario', included: true },
      { text: 'Resumen semanal por correo', included: true },
      { text: 'Gastos recurrentes automáticos', included: true },
      { text: 'Alertas por WhatsApp', included: false },
      { text: 'Exportar PDF', included: false },
    ],
  },
  {
    id: 'familia_plus',
    name: 'Familia+',
    price: 12990,
    description: 'Para familias grandes con todo incluido',
    color: 'border-yellow-400',
    badge: 'Completo',
    features: [
      { text: 'Hasta 12 miembros en el hogar', included: true },
      { text: 'Movimientos ilimitados', included: true },
      { text: 'Metas de ahorro ilimitadas', included: true },
      { text: 'Presupuestos ilimitados', included: true },
      { text: 'Dashboard completo', included: true },
      { text: 'Invitar miembros con código', included: true },
      { text: 'Importar CSV bancario', included: true },
      { text: 'Resumen semanal por correo', included: true },
      { text: 'Gastos recurrentes automáticos', included: true },
      { text: 'Alertas por WhatsApp', included: true },
      { text: 'Exportar PDF', included: true },
    ],
  },
]

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PlansPage() {
  const user = useAuthStore((s) => s.user)

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/me')
      return res.data
    },
  })

  const currentPlan = tenant?.plan ?? 'free'

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Planes y precios</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tu plan actual: <span className="font-medium text-primary-600 capitalize">{currentPlan}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id
          return (
            <div
              key={plan.id}
              className={`card border-2 relative ${plan.color} ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    plan.id === 'pro' ? 'bg-primary-600' : 'bg-yellow-500'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                <div className="mt-3">
                  {plan.price === 0 ? (
                    <p className="text-3xl font-bold text-gray-900">Gratis</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{formatCLP(plan.price)}</p>
                      <p className="text-xs text-gray-400">por mes</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-5">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón */}
              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium">
                  ✅ Plan actual
                </div>
              ) : plan.price === 0 ? (
                <div className="w-full text-center py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm">
                  Plan base
                </div>
              ) : (
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => alert('Próximamente: pago con tarjeta. Contáctanos por WhatsApp para activar tu plan.')}
                >
                  Contratar {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        Para cambiar tu plan contáctanos · Los precios incluyen IVA · Cancela cuando quieras
      </p>
    </div>
  )
}