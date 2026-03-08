'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Package } from 'lucide-react'

interface Ingredient {
    id: string
    name: string
    current_stock: number
    unit: string
    reorder_level: number
}

export default function LowStockAlerts() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                const res = await fetch('/api/inventory/alerts')
                const data = await res.json()
                setIngredients(data.ingredients || [])
            } catch (error) {
                console.error('Error fetching low stock:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLowStock()
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
                <Link href="/admin/inventory" className="text-sm text-[#C48A6A] hover:text-[#B37959]">
                    Manage Inventory
                </Link>
            </div>

            {ingredients.length > 0 ? (
                <div className="space-y-3">
                    {ingredients.map((ing) => (
                        <div
                            key={ing.id}
                            className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-900">{ing.name}</p>
                                    <p className="text-sm text-amber-700">
                                        Stock: {ing.current_stock} {ing.unit} (Min: {ing.reorder_level})
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/admin/inventory?ingredient=${ing.id}`}
                                className="px-3 py-1 bg-white text-amber-700 rounded-lg border border-amber-300 hover:bg-amber-50 text-sm"
                            >
                                Restock
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">All ingredients are well stocked</p>
                </div>
            )}
        </div>
    )
}