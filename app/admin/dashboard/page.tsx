'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardStats from './DashboardStats'
import RecentOrders from './RecentOrders'
import LowStockAlerts from './LowStockAlerts'
import { Navbar } from '@/components/Navbar'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [cart] = useState([]) // Empty cart for admin
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/login?redirectedFrom=/admin/dashboard')
                return
            }

            // Check user role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', session.user.id)
                .single()

            if (!profile || !['admin', 'manager'].includes(profile.role)) {
                router.push('/')
                return
            }

            setAuthorized(true)
            setLoading(false)
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFF5E6]">
                <Navbar cart={[]} onCartOpen={() => { }} />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C48A6A]"></div>
                </div>
            </div>
        )
    }

    if (!authorized) return null

    return (
        <div className="min-h-screen bg-[#FFF5E6]">
            <Navbar cart={cart} onCartOpen={() => { }} />
            <div className="py-8">
                <div className="mx-auto px-4 sm:px-20">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
                    <DashboardStats />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <RecentOrders />
                        <LowStockAlerts />
                    </div>
                </div>
            </div>
        </div>
    )
}