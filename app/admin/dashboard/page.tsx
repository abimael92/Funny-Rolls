// app/admin/dashboard/page.tsx
import { createServerAuthClient } from '@/lib/supabase-server-auth'
import { redirect } from 'next/navigation'
import AdminLayout from '../layout'
import DashboardStats from './DashboardStats'
import RecentOrders from './RecentOrders'
import LowStockAlerts from './LowStockAlerts'

export default async function AdminDashboard() {
    const supabase = await createServerAuthClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login?redirectedFrom=/admin/dashboard')
    }

    // Get user role - use the auth client, not admin client
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
        redirect('/')
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <DashboardStats />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentOrders />
                    <LowStockAlerts />
                </div>
            </div>
        </AdminLayout>
    )
}