'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react'

interface Stats {
    todayRevenue: number
    todayOrders: number
    totalCustomers: number
    growth: number
}

export default function DashboardStats() {
    const [stats, setStats] = useState<Stats>({
        todayRevenue: 0,
        todayOrders: 0,
        totalCustomers: 0,
        growth: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get today's date
                const today = new Date().toISOString().split('T')[0]
                console.log('Fetching stats for date:', today)

                // Fetch daily sales
                const salesRes = await fetch(`/api/reports/sales/daily?date=${today}`)
                console.log('Sales response status:', salesRes.status)
                const salesData = await salesRes.json()
                console.log('Sales data:', salesData)

                // Fetch total customers (from orders)
                const customersRes = await fetch('/api/orders/history')
                console.log('Customers response status:', customersRes.status)
                const customersData = await customersRes.json()
                console.log('Customers data:', customersData)

                // Calculate unique customers
                const uniqueCustomers = new Set(customersData.orders?.map((o: any) => o.customer_email)).size
                console.log('Unique customers:', uniqueCustomers)

                setStats({
                    todayRevenue: salesData.totalSales || 0,
                    todayOrders: salesData.orderCount || 0,
                    totalCustomers: uniqueCustomers || 0,
                    growth: 12.5
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    const statCards = [
        {
            name: 'Today\'s Revenue',
            value: `$${stats.todayRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-green-500',
            change: '+12.5%'
        },
        {
            name: 'Today\'s Orders',
            value: stats.todayOrders.toString(),
            icon: ShoppingBag,
            color: 'bg-blue-500',
            change: '+8.2%'
        },
        {
            name: 'Total Customers',
            value: stats.totalCustomers.toString(),
            icon: Users,
            color: 'bg-purple-500',
            change: '+24'
        },
        {
            name: 'Growth',
            value: `${stats.growth}%`,
            icon: TrendingUp,
            color: 'bg-amber-500',
            change: '+2.3%'
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
                <div
                    key={stat.name}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                            <p className="text-2xl font-bold mt-2">{stat.value}</p>
                            <p className="text-sm text-green-600 mt-2">{stat.change}</p>
                        </div>
                        <div className={`${stat.color} p-3 rounded-lg text-white`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}