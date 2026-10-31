import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  IndianRupee,
  PiggyBank,
  Sparkles,
  Wallet
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Link } from 'react-router-dom'
import api, { apiError, payload } from '../services/api'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(n || 0))

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [recentExpenses, setRecentExpenses] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const [expensesResponse, categoryResponse, budgetResponse] = await Promise.all([
        api.get('/api/expenses', {
          params: { page: 0, size: 1000, sortBy: 'date', direction: 'desc' }
        }),
        api.get('/api/expenses/category-wise'),
        api.get('/api/budget')
      ])

      const expensesPage = payload(expensesResponse)
      const allExpenses = Array.isArray(expensesPage?.content)
        ? expensesPage.content
        : Array.isArray(expensesPage) ? expensesPage : []
      const categoryRows = payload(categoryResponse) || []
      const budget = payload(budgetResponse)

      const now = new Date()
      const year = now.getFullYear()
      const monthIndex = now.getMonth()
      const monthExpenses = allExpenses.filter((expense) => {
        if (!expense.date) return false
        const date = new Date(`${expense.date}T00:00:00`)
        return date.getFullYear() === year && date.getMonth() === monthIndex
      })

      const monthlyTotal = monthExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0), 0
      )
      const budgetAmount = Number(budget?.monthlyLimit ?? budget?.amount ?? 0)
      const dayOfMonth = now.getDate()

      setSummary({
        monthlyTotal,
        remainingBudget: budgetAmount - monthlyTotal,
        savingsGoal: budgetAmount,
        dailyAverage: dayOfMonth > 0 ? monthlyTotal / dayOfMonth : 0
      })

      setRecentExpenses(allExpenses.slice(0, 5))
      setCategoryData(categoryRows.map((item) => ({
        name: item.categoryName || item.name || 'Uncategorised',
        total: Number(item.totalAmount ?? item.total ?? 0)
      })).filter((item) => item.total > 0))

      const monthLabels = []
      for (let offset = 5; offset >= 0; offset--) {
        const date = new Date(year, monthIndex - offset, 1)
        monthLabels.push({
          year: date.getFullYear(),
          month: date.getMonth(),
          label: date.toLocaleDateString('en-IN', { month: 'short' }),
          total: 0
        })
      }

      allExpenses.forEach((expense) => {
        if (!expense.date) return
        const date = new Date(`${expense.date}T00:00:00`)
        const bucket = monthLabels.find((item) =>
          item.year === date.getFullYear() && item.month === date.getMonth()
        )
        if (bucket) bucket.total += Number(expense.amount || 0)
      })
      setMonthlyData(monthLabels)
    } catch (error) {
      setError(apiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    if (!summary) return []

    return [
      {
        title: 'Total spent this month',
        value: money(summary.monthlyTotal),
        icon: IndianRupee,
        tone: 'blue',
        hint: 'Across all categories'
      },
      {
        title: 'Remaining budget',
        value: money(summary.remainingBudget),
        icon: Wallet,
        tone: 'emerald',
        hint: 'Based on your monthly budget'
      },
      {
        title: 'Monthly budget',
        value: money(summary.savingsGoal),
        icon: PiggyBank,
        tone: 'violet',
        hint: 'Your set spending limit'
      },
      {
        title: 'Daily average',
        value: money(summary.dailyAverage),
        icon: CalendarDays,
        tone: 'amber',
        hint: 'Average per day so far'
      }
    ]
  }, [summary])

  if (loading) {
    return <Loading label="Loading your dashboard…" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            A quick overview of your money
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track spending, budgets, and trends at a glance.
          </p>
        </div>

        <Link to="/expenses" className="primary-btn">
          <ArrowUpRight size={17} />
          Manage expenses
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Monthly spending trend</h3>
              <p className="mt-1 text-xs text-slate-500">
                Your recorded expenses over recent months
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-2.5 text-brand">
              <ChartNoAxesCombined size={18} />
            </div>
          </div>

          {monthlyData.some((item) => item.total > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e8edf4"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(value) =>
                      `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
                    }
                  />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar
                    dataKey="total"
                    name="Expenses"
                    fill="#3157d5"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No monthly data yet"
              message="Add expenses over time to see your spending trend."
            />
          )}
        </div>

        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Category breakdown</h3>
              <p className="mt-1 text-xs text-slate-500">
                Where your money goes
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <Sparkles size={18} />
            </div>
          </div>

          {categoryData.length ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ['#3157d5', '#7c3aed', '#059669', '#d97706', '#dc2626'][
                              index % 5
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-2">
                {categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: [
                            '#3157d5',
                            '#7c3aed',
                            '#059669',
                            '#d97706',
                            '#dc2626'
                          ][index % 5]
                        }}
                      />
                      {category.name}
                    </span>
                    <b className="text-ink">{money(category.total)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No categories yet"
              message="Your category breakdown will appear after you add expenses."
            />
          )}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-ink">Recent expenses</h3>
            <p className="mt-1 text-xs text-slate-500">
              Your latest recorded transactions
            </p>
          </div>

          <Link to="/expenses" className="secondary-btn">
            View all
          </Link>
        </div>

        {recentExpenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Expense</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">
                        {expense.description || 'Expense'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Transaction #{expense.id}
                      </p>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No recent expenses"
            message="Add your first expense to see it listed here."
          />
        )}
      </section>
    </div>
  )
}