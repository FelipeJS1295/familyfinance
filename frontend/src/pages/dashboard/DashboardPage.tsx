import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import api from '@/services/api'

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShort(amount: number) {
  if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount}`
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

  const { data: trend } = useQuery({
    queryKey: ['monthly-trend'],
    queryFn: async () => {
      const res = await api.get('/transactions/summary/monthly-trend')
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
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Balance principal */}
      <div className="card bg-primary-600 text-white rounded-2xl p-5">
        <p className="text-primary-200 text-sm font-medium">Balance del mes</p>
        <p className="text-4xl font-bold mt-1">{formatCLP(balance)}</p>
        <p className="text-primary-200 text-xs mt-2">
          {balance >= 0 ? '👍 Vas bien este mes' : '⚠️ Cuidado con los gastos'}
        </p>
      </div>

      {/* Ingresos y Gastos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Ingresos</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCLP(income)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs text-gray-500">Gastos</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCLP(expense)}</p>
        </div>
      </div>

      {/* Gráfico de tendencia 6 meses */}
      {trend && trend.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tendencia últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatShort}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => formatCLP(value)}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Ingresos"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Gastos"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de torta */}
      {categories?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Gastos por categoría</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
              >
                {categories.map((cat: any, i: number) => (
                  <Cell key={i} fill={cat.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCLP(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {categories.slice(0, 4).map((cat: any) => (
              <div key={cat.category_id} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-600 truncate">{cat.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presupuestos */}
      {budgets?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Presupuestos</h2>
          <div className="space-y-3">
            {budgets.slice(0, 4).map((b: any) => (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700 flex items-center gap-1">
                    <span>{b.category_icon}</span>
                    {b.category_name}
                  </span>
                  <span className={`text-xs font-medium ${
                    b.status === 'danger' ? 'text-red-500' :
                    b.status === 'warning' ? 'text-yellow-500' :
                    'text-gray-400'
                  }`}>
                    {b.percentage}%
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
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Últimos movimientos</h2>
        </div>
        {recentTx.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {tx.goal ? tx.goal.icon : tx.category?.icon ?? '💸'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                      {tx.goal ? `Meta: ${tx.goal.name}` : tx.note ?? tx.category?.name ?? 'Sin categoría'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.user?.name} · {new Date(tx.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCLP(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm py-8">
            Sin movimientos este mes
          </div>
        )}
      </div>

    </div>
  )
}