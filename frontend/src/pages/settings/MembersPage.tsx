import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

const schema = z.object({
  name: z.string().min(2, 'Ingresa el nombre completo'),
  role: z.enum(['member', 'child']),
})

type FormData = z.infer<typeof schema>

export default function MembersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [planError, setPlanError] = useState('')

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/tenants/members')
      return res.data
    },
  })

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await api.get('/invitations/list')
      return res.data
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/invitations/create', data),
    onSuccess: (res) => {
      setNewCode(res.data.code)
      setPlanError('')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      reset()
      setShowForm(false)
    },
    onError: (err: any) => {
      const status = err.response?.status
      const detail = err.response?.data?.detail ?? 'Error al crear el código'
      if (status === 402) {
        setPlanError(detail)
        setShowForm(false)
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
  })

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    member: 'Miembro',
    child: 'Hijo',
    superadmin: 'Super Admin',
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Error de plan */}
      {planError && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Función no disponible en tu plan</p>
              <p className="text-sm text-yellow-700 mb-3">{planError}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/plans')}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                >
                  Ver planes disponibles
                </button>
                <button
                  onClick={() => setPlanError('')}
                  className="text-sm text-yellow-600 hover:text-yellow-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Código recién creado */}
      {newCode && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
          <p className="text-green-700 font-medium mb-2">✅ Código creado exitosamente</p>
          <p className="text-gray-500 text-sm mb-4">Comparte este código con la persona invitada</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl font-bold tracking-widest text-gray-900">{newCode}</span>
            <button
              onClick={() => copyCode(newCode)}
              className="p-3 rounded-xl bg-green-100 hover:bg-green-200 transition"
            >
              {copiedCode === newCode
                ? <Check className="w-5 h-5 text-green-600" />
                : <Copy className="w-5 h-5 text-green-600" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">El código expira en 7 días</p>
          <button onClick={() => setNewCode(null)} className="mt-3 text-sm text-gray-400 hover:text-gray-600">
            Cerrar
          </button>
        </div>
      )}

      {/* Miembros actuales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Miembros del hogar</h2>
            <p className="text-sm text-gray-400">{members?.length ?? 0} personas</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setPlanError('') }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Invitar persona
          </button>
        </div>

        {/* Formulario de invitación */}
        {showForm && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Nueva invitación</h3>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
              <div>
                <label className="label">Nombre de la persona</label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Juan Pérez"
                  className="input"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Rol</label>
                <select {...register('role')} className="input">
                  <option value="member">Miembro</option>
                  <option value="child">Hijo</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2 text-sm">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generar código
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de miembros */}
        {loadingMembers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-3">
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
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Códigos de invitación pendientes */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Códigos de invitación</h2>
        {loadingInvitations ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : invitations?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold tracking-widest font-mono ${inv.used ? 'text-gray-300' : 'text-gray-900'}`}>
                    {inv.code}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                    <p className="text-xs text-gray-400">
                      {inv.used ? '✅ Usado' : `Expira: ${new Date(inv.expires_at).toLocaleDateString('es-CL')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!inv.used && (
                    <button onClick={() => copyCode(inv.code)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                      {copiedCode === inv.code
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  )}
                  {!inv.used && (
                    <button onClick={() => deleteMutation.mutate(inv.id)} className="p-2 rounded-lg hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-6">
            No hay códigos de invitación activos
          </p>
        )}
      </div>

    </div>
  )
}