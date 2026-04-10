import { Link } from 'react-router-dom'
import { 
  Wallet, Shield, Users, TrendingUp, 
  PieChart, Target, ArrowRight, Check,
  Smartphone, Bell, FileText
} from 'lucide-react'

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

const features = [
  {
    icon: ArrowRight,
    emoji: '💸',
    title: 'Registra en segundos',
    desc: 'Anota cualquier gasto o ingreso en menos de 3 segundos desde tu celular.',
  },
  {
    icon: PieChart,
    emoji: '📊',
    title: 'Ve en qué gastas',
    desc: 'Gráficos simples que muestran exactamente a dónde va el dinero del hogar.',
  },
  {
    icon: Target,
    emoji: '🎯',
    title: 'Ahorra para lo que importa',
    desc: 'Crea metas de ahorro y ve el progreso en tiempo real. Vacaciones, emergencias, lo que sea.',
  },
  {
    icon: Bell,
    emoji: '🔔',
    title: 'Alertas de presupuesto',
    desc: 'Te avisamos cuando estás llegando al límite en una categoría.',
  },
  {
    icon: Users,
    emoji: '👨‍👩‍👧',
    title: 'Toda la familia conectada',
    desc: 'Cada miembro tiene su propio acceso. Todos ven los movimientos del hogar.',
  },
  {
    icon: Shield,
    emoji: '🔐',
    title: 'Tus datos seguros',
    desc: 'Cifrado de extremo a extremo. Tus finanzas son privadas y solo tuyas.',
  },
]

const plans = [
  {
    name: 'Gratuito',
    price: 0,
    desc: 'Para empezar',
    features: ['1 miembro', '15 movimientos/mes', '2 metas de ahorro', 'Dashboard básico'],
    cta: 'Empezar gratis',
    to: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 7990,
    desc: 'Para familias',
    features: ['Hasta 6 miembros', 'Movimientos ilimitados', 'Importar CSV bancario', 'Resumen semanal por correo', 'Gastos recurrentes'],
    cta: 'Comenzar Pro',
    to: '/register',
    highlight: true,
  },
  {
    name: 'Familia+',
    price: 12990,
    desc: 'Todo incluido',
    features: ['Hasta 12 miembros', 'Alertas por WhatsApp', 'Exportar PDF', 'Soporte prioritario', 'Todo lo de Pro'],
    cta: 'Comenzar Familia+',
    to: '/register',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Budly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm px-4 py-2"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          🇨🇱 Hecho para familias chilenas
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Las finanzas de tu hogar,<br />
          <span className="text-primary-600">ordenadas y simples</span>
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          Budly te ayuda a registrar gastos, controlar presupuestos y ahorrar para lo que importa. 
          Toda la familia conectada en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2"
          >
            Empezar gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="btn-secondary text-base px-8 py-3.5"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Sin tarjeta de crédito · Gratis para siempre</p>
      </section>

      {/* Stats */}
      <section className="bg-primary-600 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center text-white">
            <div>
              <p className="text-3xl md:text-4xl font-bold">100%</p>
              <p className="text-primary-200 text-sm mt-1">Privado y seguro</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">3 seg</p>
              <p className="text-primary-200 text-sm mt-1">Para registrar un gasto</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">6</p>
              <p className="text-primary-200 text-sm mt-1">Miembros en plan Pro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Todo lo que necesitas</h2>
          <p className="text-gray-500">Sin complicaciones. Sin hojas de cálculo. Solo control.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Así de simple</h2>
            <p className="text-gray-500">En 3 pasos tienes el control de tus finanzas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Crea tu hogar</h3>
              <p className="text-sm text-gray-500">Regístrate gratis e invita a tu familia con un código simple.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Registra tus movimientos</h3>
              <p className="text-sm text-gray-500">Anota gastos e ingresos en segundos. Todos los ven en tiempo real.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Toma el control</h3>
              <p className="text-sm text-gray-500">Ve en qué gastas, fija presupuestos y ahorra para tus metas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Precios simples y justos</h2>
          <p className="text-gray-500">Empieza gratis. Actualiza cuando lo necesites.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card border-2 relative ${plan.highlight ? 'border-primary-500' : 'border-gray-100'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <p className="text-gray-400 text-xs">{plan.desc}</p>
                <div className="mt-3">
                  {plan.price === 0 ? (
                    <p className="text-3xl font-bold text-gray-900">Gratis</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{formatCLP(plan.price)}</p>
                      <p className="text-xs text-gray-400">por mes</p>
                    </>
                  )}
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.to}
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                  plan.highlight
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary-600 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para ordenar las finanzas de tu hogar?
          </h2>
          <p className="text-primary-200 mb-8">
            Únete a las familias que ya usan Budly para tomar el control de su dinero.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition text-base"
          >
            Crear mi hogar gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white">Budly</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Budly · Creada por Felipe Silva · Todos los derechos reservados
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/login" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Iniciar sesión
            </Link>
            <Link to="/register" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Registrarse
            </Link>
            <Link to="/unirse" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Tengo un código
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}