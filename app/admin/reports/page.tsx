"use client"

import { useEffect, useState } from "react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import ProtectedContent from "@/components/ProtectedContent"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import {
  DownloadIcon, CalendarIcon, TrendingUpIcon, TrendingDownIcon,
  DollarSignIcon, ShoppingCartIcon, UsersIcon, PackageIcon,
  RefreshCwIcon, FileTextIcon, PrinterIcon, MailIcon
} from 'lucide-react'

interface DailyReport {
  date: string
  orderCount: number
  paidCount: number
  totalSales: number
  averageTicket: number
  refunds: number
  netSales: number
  taxCollected: number
  shippingCollected: number
}

interface MonthlyReport {
  year: string
  month: number
  orderCount: number
  paidCount: number
  totalSales: number
  averageTicket: number
  refunds: number
  netSales: number
  taxCollected: number
  shippingCollected: number
  dailyBreakdown?: { date: string; sales: number; orders: number }[]
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
  category?: string
  margin?: number
  reorderPoint?: number
  stockLevel?: number
}

interface SalesTrend {
  date: string
  sales: number
  orders: number
  average: number
}

interface CustomerMetric {
  newCustomers: number
  returningCustomers: number
  averageOrderValue: number
  customerLifetimeValue: number
  retentionRate: number
}

export default function AdminReportsPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today')
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([])
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart] = useState([])
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'email'>('csv')
  const [showComparison, setShowComparison] = useState(false)
  const [previousPeriodData, setPreviousPeriodData] = useState<any>(null)

  const COLORS = ['#2e8b57', '#b85e1a', '#d4a574', '#8b4513', 
  '#4a7c5c', '#d88c4a']
// Add this helper function
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return format(date, 'MM/dd')
  } catch {
    return dateStr
  }
}



  const loadReports = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      // Daily report - required
      const dailyRes = await fetch(`/api/reports/sales/daily?date=${date}`)
      if (!dailyRes.ok) throw new Error("Error loading daily sales")
      const dailyJson = await dailyRes.json()
      setDaily(dailyJson)

      // Monthly report - required
      const monthlyRes = await fetch(
        `/api/reports/sales/monthly?year=${date.slice(0, 4)}&month=${Number(
          date.slice(5, 7)
        )}`
      )
      if (!monthlyRes.ok) throw new Error("Error loading monthly sales")
      const monthlyJson = await monthlyRes.json()
      setMonthly(monthlyJson)

      // Trend data - optional, don't throw error if it fails
      try {
        const trendRes = await fetch(`/api/reports/sales/trend?days=30`)
        if (trendRes.ok) {
          const trendJson = await trendRes.json()
          setSalesTrend(trendJson)
        }
      } catch (trendError) {
        console.log("Trend data not available")
        setSalesTrend([]) // Empty array = show "No data" message
      }

      // Customer metrics - optional
      try {
        const customersRes = await fetch(`/api/reports/customers/metrics?date=${date}`)
        if (customersRes.ok) {
          const customersJson = await customersRes.json()
          setCustomerMetrics(customersJson)
        }
      } catch (customersError) {
        console.log("Customer metrics not available")
      }

      // Product analytics from daily data
      const productMap = new Map<string, TopProduct>()
      dailyJson.orders?.forEach((o: any) => {
        o.items?.forEach((it: any) => {
          const key = it.productName || it.product_name
          if (!key) return
          const prev = productMap.get(key) || {
            name: key,
            quantity: 0,
            revenue: 0,
            category: it.category,
            margin: it.margin,
            stockLevel: it.stockLevel,
            reorderPoint: it.reorderPoint
          }
          productMap.set(key, {
            ...prev,
            quantity: prev.quantity + Number(it.quantity ?? 0),
            revenue: prev.revenue + Number(it.lineTotal ?? it.line_total ?? 0),
          })
        })
      })

      const products = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
      setTopProducts(products)

      // Load comparison data if enabled
      if (showComparison) {
        const prevDate = subDays(new Date(date), 7).toISOString().slice(0, 10)
        const prevRes = await fetch(`/api/reports/sales/daily?date=${prevDate}`)
        if (prevRes.ok) {
          setPreviousPeriodData(await prevRes.json())
        }
      }

    } catch (e: any) {
      console.error(e)
      setError(e.message || "Error loading reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports(selectedDate)
  }, [selectedDate, showComparison])

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
    setDateRange(range)
    const now = new Date()
    switch (range) {
      case 'today':
        setSelectedDate(now.toISOString().slice(0, 10))
        break
      case 'week':
        setSelectedDate(subDays(now, 7).toISOString().slice(0, 10))
        break
      case 'month':
        setSelectedDate(startOfMonth(now).toISOString().slice(0, 10))
        break
    }
  }

  const handleExport = async () => {
    if (!daily) return

    switch (exportFormat) {
      case 'csv':
        exportToCsv()
        break
      case 'pdf':
        await exportToPdf()
        break
      case 'email':
        sendEmailReport()
        break
    }
  }

  const exportToCsv = () => {
    const rows = [
      ["Report Type", "Daily Sales Report"],
      ["Generated", new Date().toLocaleString()],
      ["Date Range", selectedDate],
      [],
      ["Metric", "Value", "vs Previous", "vs Average"],
      ["Orders", daily?.orderCount || 0, previousPeriodData?.orderCount || '-', monthly?.averageTicket ? ((daily?.orderCount || 0) / 30).toFixed(1) : '-'],
      ["Paid Orders", daily?.paidCount || 0, previousPeriodData?.paidCount || '-', ''],
      ["Total Sales", `$${(daily?.totalSales || 0).toFixed(2)}`, previousPeriodData ? `$${((daily?.totalSales || 0) - previousPeriodData.totalSales).toFixed(2)}` : '-', ''],
      ["Net Sales", `$${daily?.netSales?.toFixed(2) || (daily?.totalSales || 0).toFixed(2)}`, '', ''],
      ["Average Ticket", `$${(daily?.averageTicket || 0).toFixed(2)}`, previousPeriodData ? `$${((daily?.averageTicket || 0) - previousPeriodData.averageTicket).toFixed(2)}` : '-', ''],
      ["Refunds", `$${daily?.refunds?.toFixed(2) || '0.00'}`, '', ''],
      [],
      ["Top Products"],
      ["Product", "Quantity", "Revenue", "% of Sales"],
      ...topProducts.map(p => [
        p.name,
        p.quantity,
        `$${p.revenue.toFixed(2)}`,
        `${((p.revenue / (daily?.totalSales || 1)) * 100).toFixed(1)}%`
      ])
    ]

    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPdf = async () => {
    // Implementation would use a PDF library
    alert("PDF export coming soon!")
  }

  const sendEmailReport = () => {
    // Implementation would open email modal
    alert("Email report coming soon!")
  }

  const calculateGrowth = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  const GrowthIndicator = ({ current, previous }: { current: number, previous?: number }) => {
    const growth = calculateGrowth(current, previous)
    if (growth === null) return null
    return growth > 0 ? (
      <span className="flex items-center text-green-600 text-xs">
        <TrendingUpIcon className="w-3 h-3 mr-1" />
        +{growth.toFixed(1)}%
      </span>
    ) : (
      <span className="flex items-center text-red-600 text-xs">
        <TrendingDownIcon className="w-3 h-3 mr-1" />
        {growth.toFixed(1)}%
      </span>
    )
  }

  return (
    <ProtectedContent requiredRole="manager">
      <div className="min-h-screen bg-[#FFF5E6]">
        <Navbar cart={cart} onCartOpen={() => { }} />
        <div className="py-8 px-4 sm:px-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with enhanced controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-900">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-amber-800/80">
                  Comprehensive sales, product, and customer analytics
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Date range selector */}
                <div className="flex bg-white/80 rounded-xl border border-amber-200 p-1">
                  {(['today', 'week', 'month'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => handleDateRangeChange(range)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${dateRange === range
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-700 hover:bg-amber-100'
                        }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Date picker */}
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setDateRange('custom')
                    }}
                    className="pl-9 rounded-xl border border-amber-200 bg-white text-amber-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Export dropdown */}
                <div className="flex items-center gap-1">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="rounded-l-xl border border-amber-200 bg-white text-amber-900 px-2 py-2 text-sm focus:outline-none"
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="email">Email</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!daily}
                    className="rounded-r-xl rounded-l-none border-amber-300 text-amber-900 hover:bg-amber-50 text-xs sm:text-sm"
                  >
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>

                {/* Compare toggle */}
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className={`px-3 py-2 rounded-xl text-sm flex items-center gap-1 ${showComparison
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-amber-200 text-amber-700'
                    }`}
                >
                  <RefreshCwIcon className="w-4 h-4" />
                  Compare
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            {!loading && !error && daily && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <DollarSignIcon className="w-5 h-5 text-amber-600" />
                    <GrowthIndicator current={daily.totalSales} previous={previousPeriodData?.totalSales} />
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">
                    ${daily.totalSales.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-700">Total Sales</p>
                </div>

                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <ShoppingCartIcon className="w-5 h-5 text-amber-600" />
                    <GrowthIndicator current={daily.orderCount} previous={previousPeriodData?.orderCount} />
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">
                    {daily.orderCount}
                  </p>
                  <p className="text-xs text-amber-700">Orders</p>
                </div>

                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <UsersIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">
                    {customerMetrics?.newCustomers || 0}
                  </p>
                  <p className="text-xs text-amber-700">New Customers</p>
                </div>

                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <PackageIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">
                    {topProducts.reduce((sum, p) => sum + p.quantity, 0)}
                  </p>
                  <p className="text-xs text-amber-700">Items Sold</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 bg-amber-50 rounded-lg animate-pulse w-1/3" />
                <div className="h-64 bg-amber-50 rounded-lg animate-pulse" />
                <div className="h-64 bg-amber-50 rounded-lg animate-pulse" />
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Sales Trend Chart */}
                {salesTrend && salesTrend.length > 0 ? (
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-amber-900">30-Day Sales Trend</h2>
                    <select className="text-xs border border-amber-200 rounded-lg px-2 py-1">
                      <option>Sales</option>
                      <option>Orders</option>
                      <option>Average Ticket</option>
                    </select>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2e8b57" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2e8b57" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e0d0" />
                          <XAxis dataKey="date" tickFormatter={(d) => {
                            try {
                              return format(new Date(d), 'MM/dd')
                            } catch {
                              return d
                            }
                          }} />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFF5E6',
                            border: '1px solid #d4a574',
                            borderRadius: '0.75rem'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#2e8b57"
                          fillOpacity={1}
                          fill="url(#colorSales)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                ) : (
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-amber-900 mb-4">30-Day Sales Trend</h2>
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-amber-700">No trend data available</p>
                  </div>
                </div>
)}

                {/* Daily and Monthly stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-amber-900">Daily Sales</h2>
                      {showComparison && previousPeriodData && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          vs {format(new Date(previousPeriodData.date), 'MM/dd')}
                        </span>
                      )}
                    </div>
                    {daily ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                          <span className="text-amber-700">Date</span>
                          <span className="font-semibold text-amber-900">
                            {format(new Date(daily.date), "MMMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Orders</span>
                          <div className="text-right">
                            <span className="font-semibold text-amber-900">{daily.orderCount}</span>
                            {showComparison && previousPeriodData && (
                              <GrowthIndicator current={daily.orderCount} previous={previousPeriodData.orderCount} />
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Paid orders</span>
                          <span className="font-semibold text-amber-900">{daily.paidCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Total sales</span>
                          <div className="text-right">
                            <span className="font-semibold text-amber-900">${daily.totalSales.toFixed(2)}</span>
                            {showComparison && previousPeriodData && (
                              <GrowthIndicator current={daily.totalSales} previous={previousPeriodData.totalSales} />
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Net sales</span>
                          <span className="font-semibold text-amber-900">
                            ${(daily.netSales || daily.totalSales).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Average ticket</span>
                          <div className="text-right">
                            <span className="font-semibold text-amber-900">${daily.averageTicket.toFixed(2)}</span>
                            {showComparison && previousPeriodData && (
                              <GrowthIndicator current={daily.averageTicket} previous={previousPeriodData.averageTicket} />
                            )}
                          </div>
                        </div>
                        {daily.refunds > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Refunds</span>
                            <span className="font-semibold">-${daily.refunds.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800/80">No daily data for this date.</p>
                    )}
                  </div>

                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-amber-900 mb-3">Monthly Sales</h2>
                    {monthly ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-amber-100 pb-2">
                          <span className="text-amber-700">Period</span>
                          <span className="font-semibold text-amber-900">
                            {monthly.year}-{String(monthly.month).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Orders</span>
                          <span className="font-semibold text-amber-900">{monthly.orderCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Paid orders</span>
                          <span className="font-semibold text-amber-900">{monthly.paidCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Total sales</span>
                          <span className="font-semibold text-amber-900">${monthly.totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Average ticket</span>
                          <span className="font-semibold text-amber-900">${monthly.averageTicket.toFixed(2)}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-100">
                          <div className="flex justify-between text-xs text-amber-600">
                            <span>Daily average</span>
                            <span>${(monthly.totalSales / 30).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-amber-600">
                            <span>Projected monthly</span>
                            <span>${(monthly.totalSales + (monthly.totalSales / 30 * (30 - new Date().getDate()))).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800/80">No monthly data for this period.</p>
                    )}
                  </div>
                </div>

                {/* Customer Metrics */}
                {customerMetrics && (
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-amber-900 mb-3">Customer Analytics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-amber-600">New Customers</p>
                        <p className="text-xl font-bold text-amber-900">{customerMetrics.newCustomers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">Returning</p>
                        <p className="text-xl font-bold text-amber-900">{customerMetrics.returningCustomers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">Avg Order Value</p>
                        <p className="text-xl font-bold text-amber-900">${customerMetrics.averageOrderValue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">Retention Rate</p>
                        <p className="text-xl font-bold text-amber-900">{customerMetrics.retentionRate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Products with enhanced analytics */}
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-amber-900">Top Products</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600">View:</span>
                      <select className="text-xs border border-amber-200 rounded-lg px-2 py-1">
                        <option>By Revenue</option>
                        <option>By Quantity</option>
                        <option>By Margin</option>
                      </select>
                    </div>
                  </div>

                  {topProducts.length ? (
                    <div className="space-y-3">
                      {/* Product list header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-amber-700 px-2">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-right">Qty</div>
                        <div className="col-span-3 text-right">Revenue</div>
                        <div className="col-span-2 text-right">%</div>
                      </div>

                      {/* Product rows */}
                      {topProducts.map((p, idx) => (
                        <div key={p.name} className="relative">
                          <div className="grid grid-cols-12 gap-2 items-center text-sm py-2 px-2 hover:bg-amber-50 rounded-lg transition-colors">
                            <div className="col-span-5">
                              <p className="font-medium text-amber-900 truncate" title={p.name}>
                                {p.name}
                              </p>
                              {p.category && (
                                <p className="text-xs text-amber-600">{p.category}</p>
                              )}
                            </div>
                            <div className="col-span-2 text-right font-medium text-amber-900">
                              {p.quantity}
                            </div>
                            <div className="col-span-3 text-right font-semibold text-amber-900">
                              ${p.revenue.toFixed(2)}
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                {((p.revenue / (daily?.totalSales || 1)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          {/* Stock alert */}
                          {p.stockLevel && p.reorderPoint && p.stockLevel <= p.reorderPoint && (
                            <div className="absolute -top-1 -right-1">
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Summary footer */}
                      <div className="mt-4 pt-3 border-t border-amber-100 grid grid-cols-12 gap-2 text-xs text-amber-700">
                        <div className="col-span-5">Total</div>
                        <div className="col-span-2 text-right font-medium">
                          {topProducts.reduce((sum, p) => sum + p.quantity, 0)}
                        </div>
                        <div className="col-span-3 text-right font-medium">
                          ${topProducts.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
                        </div>
                        <div className="col-span-2"></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-800/80">No product data for this date.</p>
                  )}
                </div>

                {/* Export options footer */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  >
                    <PrinterIcon className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* Schedule report */ }}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  >
                    <MailIcon className="w-4 h-4 mr-1" />
                    Schedule
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* View full report */ }}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  >
                    <FileTextIcon className="w-4 h-4 mr-1" />
                    Full Report
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedContent>
  )
}