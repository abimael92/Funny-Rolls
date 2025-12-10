"use client"

import { Fragment } from "react"
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from "lucide-react"

export interface SelectOption {
    value: string
    label: string
    fullName?: string
    [key: string]: unknown
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    color?: string
    className?: string
    disabled?: boolean
    showFullName?: boolean
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select",
    color = "amber",
    className = "",
    disabled = false,
    showFullName = true
}: CustomSelectProps) {

    const selectedOption = options.find(option => option.value === value)

    // Hardcoded color classes
    const getColorClasses = () => {
        switch (color) {
            case 'blue':
                return {
                    bg50: 'bg-blue-50',
                    border300: 'border-blue-300',
                    hoverBorder400: 'hover:border-blue-400',
                    focusBorder500: 'focus:border-blue-500',
                    focusRing100: 'focus:ring-blue-100',
                    bg100: 'bg-blue-100',
                    border200: 'border-blue-200',
                    bg50hover: 'bg-blue-50',
                    text900: 'text-blue-900',
                    text600: 'text-blue-600'
                }
            case 'emerald':
                return {
                    bg50: 'bg-emerald-50',
                    border300: 'border-emerald-300',
                    hoverBorder400: 'hover:border-emerald-400',
                    focusBorder500: 'focus:border-emerald-500',
                    focusRing100: 'focus:ring-emerald-100',
                    bg100: 'bg-emerald-100',
                    border200: 'border-emerald-200',
                    bg50hover: 'bg-emerald-50',
                    text900: 'text-emerald-900',
                    text600: 'text-emerald-600'
                }
            case 'red':
                return {
                    bg50: 'bg-red-50',
                    border300: 'border-red-300',
                    hoverBorder400: 'hover:border-red-400',
                    focusBorder500: 'focus:border-red-500',
                    focusRing100: 'focus:ring-red-100',
                    bg100: 'bg-red-100',
                    border200: 'border-red-200',
                    bg50hover: 'bg-red-50',
                    text900: 'text-red-900',
                    text600: 'text-red-600'
                }
            case 'violet':
                return {
                    bg50: 'bg-violet-50',
                    border300: 'border-violet-300',
                    hoverBorder400: 'hover:border-violet-400',
                    focusBorder500: 'focus:border-violet-500',
                    focusRing100: 'focus:ring-violet-100',
                    bg100: 'bg-violet-100',
                    border200: 'border-violet-200',
                    bg50hover: 'bg-violet-50',
                    text900: 'text-violet-900',
                    text600: 'text-violet-600'
                }
            case 'gray':
                return {
                    bg50: 'bg-gray-50',
                    border300: 'border-gray-300',
                    hoverBorder400: 'hover:border-gray-400',
                    focusBorder500: 'focus:border-gray-500',
                    focusRing100: 'focus:ring-gray-100',
                    bg100: 'bg-gray-100',
                    border200: 'border-gray-200',
                    bg50hover: 'bg-gray-50',
                    text900: 'text-gray-900',
                    text600: 'text-gray-600'
                }
            default: // amber
                return {
                    bg50: 'bg-amber-50',
                    border300: 'border-amber-300',
                    hoverBorder400: 'hover:border-amber-400',
                    focusBorder500: 'focus:border-amber-500',
                    focusRing100: 'focus:ring-amber-100',
                    bg100: 'bg-amber-100',
                    border200: 'border-amber-200',
                    bg50hover: 'bg-amber-50',
                    text900: 'text-amber-900',
                    text600: 'text-amber-600'
                }
        }
    }

    const colors = getColorClasses()

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={`relative ${className}`}>
                <Listbox.Button
                    className={`w-full px-3 py-2.5 sm:px-4 sm:py-3.5 ${colors.bg50} border-2 ${colors.border300} rounded-xl text-gray-400 text-sm sm:text-base font-medium transition-all duration-200 ease-in-out cursor-pointer shadow-sm ${colors.hoverBorder400} hover:shadow-md ${colors.focusBorder500} focus:ring-2 ${colors.focusRing100} focus:shadow-md outline-none text-left pr-10 sm:pr-12 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={`block truncate ${colors.text900} font-medium`}>
                        {selectedOption?.label || placeholder}
                        {showFullName && selectedOption?.fullName && (
                            <span className="text-gray-600 text-xs sm:text-sm ml-1 sm:ml-2">
                                - {selectedOption.fullName}
                            </span>
                        )}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4 pointer-events-none">
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text600} transition-transform duration-200 ui-open:rotate-180`} />
                    </span>
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className={`absolute z-[9999] w-full py-1 sm:py-2 mt-1 overflow-auto text-sm sm:text-base ${colors.bg100} rounded-xl shadow-lg max-h-28 sm:max-h-32 ring-1 ring-black ring-opacity-5 focus:outline-none border ${colors.border200} top-full`}>
                        {options.map((option) => (
                            <Listbox.Option
                                key={option.value}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-1 px-3 sm:px-4 transition-colors duration-200 ${active ? `${colors.bg50hover} ${colors.text900}` : `${colors.text900}`} ${value === option.value ? `${colors.bg100} ${colors.text900}` : ''}`
                                }
                                value={option.value}
                            >
                                {({ selected }) => (
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium truncate">{option.label}</span>
                                            {showFullName && option.fullName && (
                                                <span className="text-gray-800 text-xs sm:text-sm ml-1 sm:ml-2 truncate">- {option.fullName}</span>
                                            )}
                                        </div>
                                        {selected && (
                                            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text900} flex-shrink-0 ml-2`} />
                                        )}
                                    </div>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    )
}



// Units array for your specific use case
export const units = [
    { value: '', label: 'Unidad de Medida', fullName: '' },
    { value: 'kg', label: 'kg', fullName: 'kilogramo' },
    { value: 'g', label: 'g', fullName: 'gramo' },
    { value: 'lb', label: 'lb', fullName: 'libra' },
    { value: 'oz', label: 'oz', fullName: 'onza' },
    { value: 'l', label: 'l', fullName: 'litro' },
    { value: 'ml', label: 'ml', fullName: 'mililitro' },
    { value: 'cup', label: 'cup', fullName: 'taza' },
    { value: 'tbsp', label: 'tbsp', fullName: 'cucharada' },
    { value: 'tsp', label: 'tsp', fullName: 'cucharadita' },
    { value: 'unidad', label: 'unidad', fullName: '' },
    { value: 'docena', label: 'docena', fullName: '' },
    { value: 'paquete', label: 'paquete', fullName: '' },
    { value: 'sobre', label: 'sobre', fullName: '' },
    { value: 'latas', label: 'latas', fullName: '' },
    { value: 'botella', label: 'botella', fullName: '' },
    { value: 'bolsa', label: 'bolsa', fullName: '' },
]