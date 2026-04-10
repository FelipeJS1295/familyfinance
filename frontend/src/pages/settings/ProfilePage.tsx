import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Check } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const profileSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre completo'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
  new_password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string().min(8, 'Confirma tu contraseña'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#3b82f6', '#06b6d4', '#84cc16', '#64748b',
]

export default function ProfilePage() {
  const { user, setAuth, updateUser } = useAuthStore()
  const [selectedColor, setSelectedColor] = useState(user?.avatar_color ?? '#6366f1')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function onUpdateProfile(data: ProfileForm) {
    setProfileSuccess('')
    try {
      const res = await api.patch('/auth/profile', {
        name: data.name,
        avatar_color: selectedColor,
      })
      updateUser({ name: res.data.name, avatar_color: res.data.avatar_color })
      setProfileSuccess('Perfil actualizado correctamente')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch {
      // error silencioso
    }
  }

  async function onChangePassword(data: PasswordForm) {
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await api.patch('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      setPasswordSuccess('Contraseña actualizada correctamente')
      passwordForm.reset()
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail ?? 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="space-y-6 max-w-lg">

      {/* Avatar y nombre */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Mi perfil</h2>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
            style={{ backgroundColor: selectedColor }}
          >
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="label">Nombre completo</label>
            <input
              {...profileForm.register('name')}
              type="text"
              className="input"
            />
            {profileForm.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Color de avatar */}
          <div>
            <label className="label">Color de avatar</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#1f2937' : 'transparent',
                    transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {selectedColor === color && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              ✅ {profileSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {profileForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">

          <div>
            <label className="label">Contraseña actual</label>
            <input
              {...passwordForm.register('current_password')}
              type="password"
              placeholder="••••••••"
              className="input"
            />
            {passwordForm.formState.errors.current_password && (
              <p className="text-red-500 text-xs mt-1">
                {passwordForm.formState.errors.current_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Nueva contraseña</label>
            <input
              {...passwordForm.register('new_password')}
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="input"
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-red-500 text-xs mt-1">
                {passwordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              {...passwordForm.register('confirm_password')}
              type="password"
              placeholder="Repite la contraseña"
              className="input"
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              ✅ {passwordSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {passwordForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar contraseña
          </button>
        </form>
      </div>

    </div>
  )
}