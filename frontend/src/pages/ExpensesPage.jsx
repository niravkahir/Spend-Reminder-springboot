
import { useEffect, useState } from 'react'
import {
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X
} from 'lucide-react'
import api, { apiError, payload } from '../services/api'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))

const today = () => {
  const date = new Date()

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const blankForm = () => ({
  amount: '',
  date: today(),
  description: '',
  categoryId: ''
})

export default function ExpensesPage() {
  const [page, setPage] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const [expenseResponse, categoryResponse] = await Promise.all([
        api.get('/api/expenses', {
          params: {
            page,
            size: 10,
            sortBy: 'date',
            direction: 'desc'
          }
        }),
        api.get('/api/categories')
      ])

      const expenseData = payload(expenseResponse)

      setExpenses(expenseData?.content || [])
      setTotalPages(expenseData?.totalPages || 0)
      setCategories(payload(categoryResponse) || [])
    } catch (error) {
      setError(apiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const openAdd = () => {
    setEditing(null)
    setForm({
      ...blankForm(),
      categoryId: categories[0]?.id || ''
    })
    setError('')
    setFormOpen(true)
  }

  const openEdit = (expense) => {
    setEditing(expense.id)
    setForm({
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description || '',
      categoryId: String(expense.category?.id || '')
    })
    setError('')
    setFormOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const body = {
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        categoryId: Number(form.categoryId)
      }

      if (editing) {
        await api.put(`/api/expenses/${editing}`, body)
      } else {
        await api.post('/api/expenses', body)
      }

      setSuccess(editing ? 'Expense updated.' : 'Expense added.')
      setFormOpen(false)
      setForm(blankForm())

      await load()
    } catch (error) {
      setError(apiError(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    const confirmed = window.confirm(
      'Delete this expense? This cannot be undone.'
    )

    if (!confirmed) return

    setError('')

    try {
      await api.delete(`/api/expenses/${id}`)
      setSuccess('Expense deleted.')

      await load()
    } catch (error) {
      setError(apiError(error))
    }
  }

  const filteredExpenses = expenses.filter((expense) =>
    `${expense.description || ''} ${expense.category?.name || ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            Keep every transaction in one place
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Transactions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add, review, edit, or remove your expenses.
          </p>
        </div>

        <button onClick={openAdd} className="primary-btn">
          <Plus size={17} />
          Add expense
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {formOpen && (
        <section className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">
                {editing ? 'Edit expense' : 'Add a new expense'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Your changes are saved to your account.
              </p>
            </div>

            <button
              onClick={() => setFormOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="field-label">
              Amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="field"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="0.00"
              />
            </label>

            <label className="field-label">
              Date
              <input
                required
                type="date"
                max={today()}
                className="field"
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />
            </label>

            <label className="field-label">
              Category
              <select
                required
                className="field"
                value={form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, categoryId: event.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Description
              <input
                maxLength="500"
                className="field"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="What was this for?"
              />
            </label>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                disabled={saving || !categories.length}
                className="primary-btn"
              >
                {saving
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Save expense'}
              </button>

              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="secondary-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-ink">All expenses</h3>
            <p className="mt-1 text-xs text-slate-500">
              Showing page {page + 1} of {Math.max(totalPages, 1)}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="field pl-9"
              placeholder="Search this page…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : filteredExpenses.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Expense</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-50 p-2.5 text-brand">
                            <ReceiptText size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {expense.description || 'Expense'}
                            </p>
                            <p className="text-xs text-slate-400">
                              Transaction #{expense.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {expense.category?.name || 'Uncategorised'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {expense.date}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-ink">
                        {money(expense.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Edit"
                            onClick={() => openEdit(expense)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-brand"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title="Delete"
                            onClick={() => remove(expense.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
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

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                {expenses.length} transactions on this page
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                  className="secondary-btn px-3 py-2"
                >
                  Previous
                </button>

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="secondary-btn px-3 py-2"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? 'No matching expenses' : 'No expenses recorded'}
            message={
              query
                ? 'Try another search term.'
                : 'Add your first expense to start tracking your money.'
            }
          />
        )}
      </section>
    </div>
  )
}
