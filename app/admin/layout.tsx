'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChefHat,
    ClipboardList
} from 'lucide-react'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Inventory', href: '/admin/inventory', icon: Package },
        { name: 'Production', href: '/admin/production', icon: ChefHat },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
                <div className="flex items-center justify-center h-16 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-[#C48A6A]">Funny Rolls Admin</h1>
                </div>
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-[#C48A6A] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}

                    {/* Logout button */}
                    <button
                        onClick={() => {
                            // Add logout logic here
                            window.location.href = '/api/auth/logout'
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mt-8"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="ml-64 p-8">
                {children}
            </div>
        </div>
    )
}