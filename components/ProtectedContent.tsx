'use client'

import { useAuth } from '@/app/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedContentProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'manager' | 'staff' | 'viewer'
}

export default function ProtectedContent({
    children,
    requiredRole
}: ProtectedContentProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }

        if (!loading && user && requiredRole) {
            const hasRequiredRole = user.role === requiredRole ||
                (requiredRole === 'admin' && user.role === 'manager') ||
                (requiredRole === 'manager' && user.role === 'admin')

            if (!hasRequiredRole) {
                router.push('/')
            }
        }
    }, [user, loading, router, requiredRole])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C48A6A]"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (requiredRole) {
        const hasRequiredRole = user.role === requiredRole ||
            (requiredRole === 'admin' && user.role === 'manager') ||
            (requiredRole === 'manager' && user.role === 'admin')

        if (!hasRequiredRole) {
            return null
        }
    }

    return <>{children}</>
}