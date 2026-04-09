import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/services/api'

const schema = z.object({
  category_id: z.string().min(1, 'Selecciona una categoría'),
  monthly_limit: z.coerce.number().positive('El límite debe ser mayor a 0'),
  month: z.coerce.number(),
  year: z.coerce.number(),
})

type FormData = z.infer<typeof schema>

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BudgetsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const res = await api.get('/budgets', { params: { month, year } })
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { month, year },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      reset()
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Controla cuánto puedes gastar por categoría cada mes
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo presupuesto
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-4">Definir presupuesto</h3>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Categoría</label>
              <select {...register('category_id')} className="input">
                <option value="">Selecciona una categoría</option>
                {categories?.filter((c: any) => !c.is_income).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="label">Límite mensual ($)</label>
              <input
                {...register('monthly_limit')}
                type="number"
                placeholder="200000"
                className="input"
              />
              {errors.monthly_limit && (
                <p className="text-red-500 text-xs mt-1">{errors.monthly_limit.message}</p>
              )}
            </div>

            <input type="hidden" {...register('month')} />
            <input type="hidden" {...register('year')} />

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

      {/* Lista de presupuestos */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : budgets?.length > 0 ? (
        <div className="space-y-4">
          {budgets.map((b: any) => (
            <div key={b.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{b.category_icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{b.category_name}</p>
                    <p className="text-xs text-gray-400">
                      {formatCLP(b.spent)} gastado de {formatCLP(b.monthly_limit)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${
                    b.status === 'danger' ? 'text-red-500' :
                    b.status === 'warning' ? 'text-yellow-500' :
                    'text-green-600'
                  }`}>
                    {b.percentage}%
                  </span>
                  {b.status === 'danger' && (
                    <span className="badge-red">Excedido</span>
                  )}
                  {b.status === 'warning' && (
                    <span className="badge-yellow">⚠️ 80%</span>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(b.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    b.status === 'danger' ? 'bg-red-500' :
                    b.status === 'warning' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>

              {b.status === 'danger' && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Superaste el límite por {formatCLP(b.spent - b.monthly_limit)}
                </p>
              )}
              {b.status === 'warning' && (
                <p className="text-xs text-yellow-600 mt-2">
                  Cuidado, te queda solo {formatCLP(b.monthly_limit - b.spent)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">Sin presupuestos definidos</p>
          <p className="text-sm mt-1">Crea tu primer presupuesto para controlar tus gastos</p>
        </div>
      )}
    </div>
  )
}