import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Trash2, Filter, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/services/api'

const schema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['income', 'expense', 'saving']),
  date: z.string().min(1, 'Selecciona una fecha'),
  note: z.string().optional(),
  category_id: z.string().optional(),
  goal_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterType, setFilterType] = useState('')

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('type')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filterMonth, filterYear, filterCategory, filterMember, filterType],
    queryFn: async () => {
      const params: any = { month: filterMonth, year: filterYear }
      if (filterCategory) params.category_id = filterCategory
      if (filterType) params.type = filterType
      const res = await api.get('/transactions', { params })
      return res.data
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/tenants/categories')
      return res.data
    },
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/tenants/members')
      return res.data
    },
  })

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/goals')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = {
        amount: data.amount,
        date: data.date,
        note: data.note,
        type: data.type === 'saving' ? 'income' : data.type,
        category_id: data.type !== 'saving' ? data.category_id : undefined,
        goal_id: data.type === 'saving' ? data.goal_id : undefined,
      }
      return api.post('/transactions', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary-category'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  function handleDelete(id: string) {
    if (window.confirm('¿Estás seguro que quieres eliminar este movimiento?')) {
      deleteMutation.mutate(id)
    }
  }

  function clearFilters() {
    setFilterMonth(now.getMonth() + 1)
    setFilterYear(now.getFullYear())
    setFilterCategory('')
    setFilterMember('')
    setFilterType('')
  }

  // Filtrar por miembro en el frontend
  const filteredItems = data?.items?.filter((tx: any) => {
    if (filterMember && tx.user?.id !== filterMember) return false
    return true
  }) ?? []

  const hasActiveFilters = filterCategory || filterMember || filterType ||
    filterMonth !== now.getMonth() + 1 || filterYear !== now.getFullYear()

  // Años disponibles
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {filteredItems.length} movimientos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              hasActiveFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="card border-2 border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">

            {/* Mes */}
            <div>
              <label className="label">Mes</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="input text-sm py-2"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <label className="label">Año</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="input text-sm py-2"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="label">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="label">Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Todas</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Miembro */}
            <div className="col-span-2">
              <label className="label">Miembro</label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Todos los miembros</option>
                {members?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* Resumen del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Ingresos</p>
          <p className="text-sm font-bold text-green-600">{formatCLP(data?.total_income ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Gastos</p>
          <p className="text-sm font-bold text-red-500">{formatCLP(data?.total_expense ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400">Balance</p>
          <p className={`text-sm font-bold ${(data?.balance ?? 0) >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
            {formatCLP(data?.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card border-primary-200 border-2">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar movimiento</h3>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="flex gap-2">
              <label className="flex-1">
                <input {...register('type')} type="radio" value="expense" className="sr-only peer" />
                <div className="peer-checked:bg-red-500 peer-checked:text-white bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl cursor-pointer font-medium text-sm transition-all">
                  💸 Gasto
                </div>
              </label>
              <label className="flex-1">
                <input {...register('type')} type="radio" value="income" className="sr-only peer" />
                <div className="peer-checked:bg-green-500 peer-checked:text-white bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl cursor-pointer font-medium text-sm transition-all">
                  💰 Ingreso
                </div>
              </label>
              <label className="flex-1">
                <input {...register('type')} type="radio" value="saving" className="sr-only peer" />
                <div className="peer-checked:bg-primary-500 peer-checked:text-white bg-gray-100 text-gray-600 text-center py-2.5 rounded-xl cursor-pointer font-medium text-sm transition-all">
                  🎯 Meta
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monto ($)</label>
                <input {...register('amount')} type="number" placeholder="50000" className="input" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="label">Fecha</label>
                <input {...register('date')} type="date" className="input" />
              </div>
            </div>

            {selectedType !== 'saving' && (
              <div>
                <label className="label">Categoría</label>
                <select {...register('category_id')} className="input">
                  <option value="">Sin categoría</option>
                  {categories
                    ?.filter((c: any) => selectedType === 'income' ? c.is_income : !c.is_income)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                </select>
              </div>
            )}

            {selectedType === 'saving' && (
              <div>
                <label className="label">¿Para qué meta?</label>
                <select {...register('goal_id')} className="input">
                  <option value="">Selecciona una meta</option>
                  {goals?.filter((g: any) => !g.is_completed).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.icon} {g.name} — {g.percentage}%</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Nota (opcional)</label>
              <input {...register('note')} type="text" placeholder="¿En qué gastaste?" className="input" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredItems.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {tx.goal ? tx.goal.icon : tx.category?.icon ?? '💸'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px] md:max-w-xs">
                      {tx.goal ? `Meta: ${tx.goal.name}` : tx.note || tx.category?.name || 'Sin categoría'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.user?.name} · {new Date(tx.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCLP(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-medium">Sin movimientos</p>
            <p className="text-sm mt-1">
              {hasActiveFilters ? 'No hay resultados con estos filtros' : 'Registra tu primer movimiento'}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}