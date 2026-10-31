import { useEffect, useState } from 'react'
import { Plus, Shield, Trash2, Users } from 'lucide-react'
import api, { apiError, payload } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const [u, c] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/categories')
      ])

      setUsers(payload(u) || [])
      setCategories(payload(c) || [])
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const changeRole = async (target) => {
    const role = target.role === 'ADMIN' ? 'USER' : 'ADMIN'

    if (!window.confirm(`Change ${target.username}'s role to ${role}?`)) return

    try {
      await api.put(`/api/admin/users/${target.id}/role`, null, {
        params: { role }
      })

      setSuccess(`Updated ${target.username} to ${role}.`)

      await load()
    } catch (e) {
      setError(apiError(e))
    }
  }

  const remove = async (target) => {
    if (
      !window.confirm(
        `Permanently delete ${target.username} and their related data?`
      )
    )
      return

    try {
      await api.delete(`/api/admin/users/${target.id}`)

      setSuccess(`Deleted ${target.username}.`)

      await load()
    } catch (e) {
      setError(apiError(e))
    }
  }

  const addCategory = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      await api.post('/api/categories', form)

      setForm({ name: '', description: '' })
      setSuccess('Category created.')

      await load()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="Loading admin workspace…" />

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Administrative controls</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Admin workspace
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage registered accounts and expense categories.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-blue-50 p-3 text-brand">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-ink">Registered users</h3>
            <p className="text-xs text-slate-500">{users.length} accounts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-ink">{u.name}</p>
                    <p className="text-xs text-slate-400">
                      @{u.username} · #{u.id}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => changeRole(u)}
                        disabled={u.id === user?.id}
                        className="secondary-btn px-3 py-2 text-xs"
                      >
                        <Shield size={14} />
                        {u.role === 'ADMIN' ? 'Make user' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => remove(u)}
                        disabled={u.id === user?.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="panel p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <Plus size={19} />
            </div>
            <div>
              <h3 className="font-bold text-ink">Add category</h3>
              <p className="text-xs text-slate-500">Create an expense category</p>
            </div>
          </div>

          <form onSubmit={addCategory} className="mt-5 space-y-4">
            <label className="field-label">
              Category name
              <input
                required
                maxLength="50"
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Subscriptions"
              />
            </label>

            <label className="field-label">
              Description
              <input
                maxLength="255"
                className="field"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What belongs here?"
              />
            </label>

            <button disabled={saving} className="primary-btn w-full">
              {saving ? 'Saving…' : 'Create category'}
            </button>
          </form>
        </div>

        <div className="panel p-5">
          <h3 className="font-bold text-ink">Available categories</h3>
          <p className="mt-1 text-xs text-slate-500">
            Categories currently available to all users.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.description || 'No description'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}