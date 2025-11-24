import { Fragment } from "react"
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from "lucide-react"

const units = [
    { value: '', label: 'Unidad', fullName: '' },
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

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
}

export function CustomSelect({ value, onChange }: CustomSelectProps) {
    const selectedUnit = units.find(unit => unit.value === value)

    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative">
                <Listbox.Button className="w-full px-3 py-2.5 sm:px-4 sm:py-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-gray-400 text-sm sm:text-base font-medium transition-all duration-200 ease-in-out cursor-pointer shadow-sm hover:border-amber-400 hover:shadow-md focus:border-amber-500 focus:ring-4 focus:ring-amber-100 focus:shadow-lg outline-none text-left pr-10 sm:pr-12">
                    <span className="block truncate">
                        {selectedUnit?.label || 'Unidad'}
                        {selectedUnit?.fullName && (
                            <span className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2">
                                - {selectedUnit.fullName}
                            </span>
                        )}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4 pointer-events-none">
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 transition-transform duration-200 ui-open:rotate-180" />
                    </span>
                </Listbox.Button>

                {/* Use portal to render outside the container but maintain positioning */}
                <div className="relative">
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-[9999] w-full py-1 sm:py-2 mt-1 overflow-auto text-sm sm:text-base bg-amber-100 rounded-xl shadow-lg max-h-28 sm:max-h-32 ring-1 ring-black ring-opacity-5 focus:outline-none border border-amber-200 top-full">
                            {units.map((unit) => (
                                <Listbox.Option
                                    key={unit.value}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none py-1 px-3 sm:px-4 transition-colors duration-200 ${active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                                        } ${value === unit.value ? 'bg-amber-100 text-amber-900' : ''}`
                                    }
                                    value={unit.value}
                                >
                                    {({ selected }) => (
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium truncate">{unit.label}</span>
                                                {unit.fullName && (
                                                    <span className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2 truncate">- {unit.fullName}</span>
                                                )}
                                            </div>
                                            {selected && (
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 ml-2" />
                                            )}
                                        </div>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </div>
        </Listbox>
    )
}