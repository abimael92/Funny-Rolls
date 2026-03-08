'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'

interface Order {
    id: string
    order_number: string
    customer_name: string
    total: number
    status: string
    created_at: string
}

export default function RecentOrders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders/history?limit=5')
                const data = await res.json()
                setOrders(data.orders || [])
            } catch (error) {
                console.error('Error fetching orders:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-blue-100 text-blue-800',
            preparing: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link href="/admin/orders" className="text-sm text-[#C48A6A] hover:text-[#B37959]">
                    View All
                </Link>
            </div>

            <div className="space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-600">{order.customer_name || 'Walk-in'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">${order.total.toFixed(2)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 text-gray-500 hover:text-[#C48A6A]"
                        >
                            <Eye className="h-4 w-4" />
                        </Link>
                    </div>
                ))}

                {orders.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No orders yet</p>
                )}
            </div>
        </div>
    )
}