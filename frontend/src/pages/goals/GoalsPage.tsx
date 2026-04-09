import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/services/api'

const schema = z.object({
  name: z.string().min(2, 'Ingresa el nombre de la meta'),
  target_amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  deadline: z.string().optional(),
  icon: z.string().default('🎯'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

const ICONS = ['🎯', '🏠', '✈️', '🚗', '📚', '💊', '🎓', '🏖️', '💻', '🎁']

export default function GoalsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState('🎯')

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/goals')
      return res.data
    },
  })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { icon: '🎯' },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      reset()
      setSelectedIcon('🎯')
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      api.patch(`/goals/${id}`, { is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Ahorra para lo que más importa
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva meta
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-4">Crear meta de ahorro</h3>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">

            {/* Selector de ícono */}
            <div>
              <label className="label">Ícono</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(icon)
                      setValue('icon', icon)
                    }}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                      selectedIcon === icon
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
              <label className="label">Nombre de la meta</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Ej: Fondo de emergencia"
                className="input"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Descripción (opcional)</label>
              <input
                {...register('description')}
                type="text"
                placeholder="¿Para qué es esta meta?"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monto objetivo ($)</label>
                <input
                  {...register('target_amount')}
                  type="number"
                  placeholder="1000000"
                  className="input"
                />
                {errors.target_amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.target_amount.message}</p>
                )}
              </div>
              <div>
                <label className="label">Fecha límite (opcional)</label>
                <input
                  {...register('deadline')}
                  type="date"
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar meta
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de metas */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : goals?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g: any) => (
            <div
              key={g.id}
              className={`card ${g.is_completed ? 'opacity-75 bg-green-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{g.icon}</span>
                  <div>
                    <p className={`font-semibold text-gray-900 ${g.is_completed ? 'line-through' : ''}`}>
                      {g.name}
                    </p>
                    {g.description && (
                      <p className="text-xs text-gray-400">{g.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {g.is_completed && <span className="badge-green">✓ Lograda</span>}
                  <button
                    onClick={() => deleteMutation.mutate(g.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {formatCLP(g.current_amount)} ahorrado
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCLP(g.target_amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${Math.min(g.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {g.percentage}% completado
                  </span>
                  {g.days_left !== null && !g.is_completed && (
                    <span className={`text-xs font-medium ${
                      g.days_left < 30 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {g.days_left > 0 ? `${g.days_left} días restantes` : 'Vencida'}
                    </span>
                  )}
                </div>
              </div>

              {/* Marcar como completada */}
              {!g.is_completed && g.percentage >= 100 && (
                <button
                  onClick={() => toggleMutation.mutate({ id: g.id, is_completed: true })}
                  className="mt-4 w-full btn-primary text-sm py-2"
                >
                  🎉 Marcar como lograda
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium">Sin metas de ahorro</p>
          <p className="text-sm mt-1">Define tu primera meta y empieza a ahorrar</p>
        </div>
      )}
    </div>
  )
}