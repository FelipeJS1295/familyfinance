import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Trash2 } from 'lucide-react'
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

export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('type')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', month, year],
    queryFn: async () => {
      const res = await api.get('/transactions', { params: { month, year } })
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Total: {data?.total ?? 0} movimientos este mes
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo movimiento
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card border-primary-200 border-2">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar movimiento</h3>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">

            {/* Tipo */}
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
                <input
                  {...register('amount')}
                  type="number"
                  placeholder="50000"
                  className="input"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="label">Fecha</label>
                <input {...register('date')} type="date" className="input" />
              </div>
            </div>

            {/* Categoría — solo para gasto e ingreso */}
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

            {/* Meta — solo para ahorro */}
            {selectedType === 'saving' && (
              <div>
                <label className="label">¿Para qué meta es este ahorro?</label>
                <select {...register('goal_id')} className="input">
                  <option value="">Selecciona una meta</option>
                  {goals
                    ?.filter((g: any) => !g.is_completed)
                    .map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.name} — {g.percentage}% completada
                      </option>
                    ))}
                </select>
                {goals?.filter((g: any) => !g.is_completed).length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    No tienes metas activas. Crea una en la sección Metas.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">Nota (opcional)</label>
              <input
                {...register('note')}
                type="text"
                placeholder="¿En qué gastaste o para qué es?"
                className="input"
              />
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
        ) : data?.items?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {data.items.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {tx.goal ? tx.goal.icon : tx.category?.icon ?? '💸'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.goal
                        ? `Meta: ${tx.goal.name}`
                        : tx.note || tx.category?.name || 'Sin categoría'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.user?.name} · {new Date(tx.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCLP(tx.amount)}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(tx.id)}
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
            <p className="font-medium">Sin movimientos este mes</p>
            <p className="text-sm mt-1">Registra tu primer gasto o ingreso</p>
          </div>
        )}
      </div>

    </div>
  )
}