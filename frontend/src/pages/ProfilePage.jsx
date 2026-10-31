import { useEffect, useState } from 'react'
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import api, { apiError, payload } from '../services/api'
import Loading from '../components/Loading'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/users/profile')
      .then((response) => setUser(payload(response)))
      .catch((error) => setError(apiError(error)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Loading label="Loading your profile…" />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Your account details</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          My profile
        </h2>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {user && (
        <section className="panel max-w-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-ink to-[#284775] px-6 py-8 text-white">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-2xl font-bold">
              {user.name?.slice(0, 1)?.toUpperCase() || 'U'}
            </div>
            <h3 className="mt-4 text-xl font-bold">{user.name}</h3>
            <p className="mt-1 text-sm text-slate-300">@{user.username}</p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-brand">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Full name</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <AtSign size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email address</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Account role</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <BadgeCheck size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Account ID</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  #{user.id}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            Profile details are currently read-only because the existing backend
            exposes profile retrieval but no self-service profile update
            endpoint.
          </div>
        </section>
      )}
    </div>
  )
}