import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, Target, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '@/services/api'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: string
  icon: any
  color: string
  sub?: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', month, year],
    queryFn: async () => {
      const res = await api.get('/transactions', { params: { month, year } })
      return res.data
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['summary-category', month, year],
    queryFn: async () => {
      const res = await api.get('/transactions/summary/by-category', {
        params: { month, year },
      })
      return res.data
    },
  })

  const { data: budgets } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const res = await api.get('/budgets', { params: { month, year } })
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const income = data?.total_income ?? 0
  const expense = data?.total_expense ?? 0
  const balance = data?.balance ?? 0
  const recentTx = data?.items?.slice(0, 5) ?? []

  return (
    <div className="space-y-6">

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Balance del mes"
          value={formatCLP(balance)}
          icon={Wallet}
          color={balance >= 0 ? 'bg-primary-500' : 'bg-red-500'}
          sub={balance >= 0 ? 'Vas bien 👍' : 'Cuidado con los gastos'}
        />
        <StatCard
          label="Ingresos"
          value={formatCLP(income)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          label="Gastos"
          value={formatCLP(expense)}
          icon={TrendingDown}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico de torta */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Gastos por categoría
          </h2>
          {categories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                >
                  {categories.map((cat: any, i: number) => (
                    <Cell key={i} fill={cat.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCLP(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin gastos este mes todavía
            </div>
          )}
        </div>

        {/* Presupuestos */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Presupuestos del mes
          </h2>
          {budgets?.length > 0 ? (
            <div className="space-y-3">
              {budgets.slice(0, 5).map((b: any) => (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span>{b.category_icon}</span>
                      {b.category_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatCLP(b.spent)} / {formatCLP(b.monthly_limit)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        b.status === 'danger' ? 'bg-red-500' :
                        b.status === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No has definido presupuestos aún
            </div>
          )}
        </div>

      </div>

      {/* Últimos movimientos */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Últimos movimientos
        </h2>
        {recentTx.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {tx.category?.icon ?? '💸'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.note ?? tx.category?.name ?? 'Sin categoría'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.user?.name} · {new Date(tx.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCLP(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm py-8">
            Sin movimientos este mes. ¡Registra tu primer gasto!
          </div>
        )}
      </div>

    </div>
  )
}