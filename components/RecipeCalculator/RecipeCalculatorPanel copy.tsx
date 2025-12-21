"use client"

import { useState, useRef, useEffect } from 'react';
import { Card, , CardHeader, CardTitle } from "@/components/ui/card"
import { Ingredient, Recipe } from '@/lib/types'

interface RecipeCalculatorPanelProps {
    selectedRecipe: Recipe
    setSelectedRecipe: (recipe: Recipe) => void
    recipes: Recipe[]
    setRecipes: (recipes: Recipe[]) => void
    ingredients: Ingredient[]
    recordProduction: (recipeId: string, batchCount: number) => void // ✅ ADDED THIS PROP
}

export function RecipeCalculatorPanel({

}: RecipeCalculatorPanelProps) {

    const [ setIsMobileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])


    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Calculadora de Receta</CardTitle>
            </CardHeader>
        </Card >
    )
}