
import { useEffect, useState } from 'react'

import {
  BrainCircuit,
  CalendarClock,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertCircle
} from 'lucide-react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import api, { apiError, payload } from '../services/api'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

export default function InsightsPage() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadInsights = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const response = payload(
        await api.get('/api/ai/prediction')
      )

      setInsights(response)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadInsights()
  }, [])

  if (loading) {
    return <Loading label="Generating AI expense insights..." />
  }

  const prediction = insights?.prediction
  const history = insights?.monthlyHistory || []
  const trend = prediction?.trend

  const isIncreasing = trend === 'INCREASING'
  const isDecreasing = trend === 'DECREASING'
  const isStable = trend === 'STABLE' || !trend

  const TrendIcon = isIncreasing
    ? TrendingUp
    : isDecreasing
      ? TrendingDown
      : Minus

  const trendColor = isIncreasing
    ? 'text-amber-600'
    : isDecreasing
      ? 'text-emerald-600'
      : 'text-slate-500'

  return (
    <div className="space-y-7">

      {/* Page heading */}

      <div>
        <p className="text-sm text-slate-500">
          Your spending history can help you plan ahead
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          AI expense insights
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          AI analyzes your recorded expenses to forecast future
          spending and identify financial patterns.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <section className="panel p-6">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
              <BrainCircuit size={22} />
            </div>

            <div>
              <h3 className="font-bold text-ink">
                Next-month expense prediction
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                AI-powered analysis of your spending history
              </p>
            </div>

          </div>

          <button
            onClick={() => loadInsights(true)}
            disabled={refreshing}
            className="secondary-btn"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin' : ''}
            />

            {refreshing ? 'Analyzing...' : 'Refresh prediction'}
          </button>

        </div>

        {/* Prediction content */}

        {insights?.available && prediction ? (

          <>

            {/* Summary cards */}

            <div className="mt-7 grid gap-5 sm:grid-cols-3">

              {/* Predicted amount */}

              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-xs text-violet-700">
                  Forecast for {insights.forecastMonth}
                </p>

                <p className="mt-2 text-2xl font-bold text-violet-950">
                  {money(prediction.predictedTotal)}
                </p>
              </div>

              {/* Trend */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Predicted spending trend
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <TrendIcon className={trendColor} />

                  <span className="text-xl font-bold text-ink">
                    {Number(prediction.trendPercentage) > 0 ? '+' : ''}
                    {prediction.trendPercentage ?? 0}%
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {isStable ? 'STABLE' : trend}
                </p>
              </div>

              {/* Confidence */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Prediction confidence
                </p>

                <p className="mt-2 text-2xl font-bold text-ink">
                  {prediction.confidence || 'N/A'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Based on available history
                </p>
              </div>

            </div>

            {/* Monthly history chart + category forecast */}

            <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">

              {/* Monthly history */}

              <div>
                <h4 className="mb-3 text-sm font-bold text-ink">
                  Monthly spending history
                </h4>

                {history.length > 0 ? (

                  <div className="h-60">

                    <ResponsiveContainer width="100%" height="100%">

                      <BarChart data={history}>

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
                            `₹${value >= 1000
                              ? `${(value / 1000).toFixed(0)}k`
                              : value}`
                          }
                        />

                        <Tooltip
                          formatter={(value) => money(value)}
                        />

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
                    title="No spending history"
                    message="Add expenses to see your spending patterns."
                  />

                )}
              </div>

              {/* Category prediction */}

              <div>
                <h4 className="mb-3 text-sm font-bold text-ink">
                  AI category forecast
                </h4>

                {Object.keys(
                  prediction.categoryPredictions || {}
                ).length > 0 ? (

                  <div className="space-y-3">

                    {Object.entries(
                      prediction.categoryPredictions
                    )
                      .sort((a, b) => Number(b[1]) - Number(a[1]))
                      .map(([name, value]) => (

                        <div
                          key={name}
                          className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                        >

                          <span className="text-sm text-slate-600">
                            {name}
                          </span>

                          <b className="text-sm text-ink">
                            {money(value)}
                          </b>

                        </div>

                      ))}

                  </div>

                ) : (

                  <p className="text-sm text-slate-500">
                    Category predictions are not available.
                  </p>

                )}
              </div>

            </div>

            {/* AI analysis */}

            {prediction.reasoning && (

              <div className="mt-7 rounded-xl border border-violet-100 bg-violet-50/70 p-4">

                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-violet-900">
                  <Sparkles size={16} />
                  AI analysis
                </p>

                <p className="whitespace-pre-line text-sm leading-6 text-violet-950">
                  {prediction.reasoning}
                </p>

              </div>

            )}

            {/* Recommendations */}

            {prediction.recommendations?.length > 0 && (

              <div className="mt-6">

                <h4 className="mb-3 text-sm font-bold text-ink">
                  AI recommendations
                </h4>

                <div className="space-y-3">

                  {prediction.recommendations.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="flex gap-3 rounded-xl bg-slate-50 p-3"
                      >

                        <Lightbulb
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <p className="text-sm leading-6 text-slate-600">
                          {item}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* Footer note */}

            <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">

              <CalendarClock
                size={15}
                className="mt-0.5 shrink-0"
              />

              AI predictions are estimates based on your recorded
              spending from the previous three completed months.
              Actual future expenses may differ.

            </p>

          </>

        ) : (

          <div className="mt-7">

            <EmptyState
              title={
                insights?.historyMonths === 0
                  ? 'Not enough expense history'
                  : 'AI prediction unavailable'
              }
              message={
                insights?.message ||
                'AI could not generate a prediction. Please try again.'
              }
            />

          </div>

        )}

      </section>

    </div>
  )
}
