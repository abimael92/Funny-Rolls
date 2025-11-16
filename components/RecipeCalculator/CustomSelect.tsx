import { Fragment } from "react"
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from "lucide-react"

const units = [
    { value: '', label: 'Seleccionar unidad', fullName: '' },
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
                <Listbox.Button className="w-full px-4 py-3.5 bg-white border-2 border-amber-300 rounded-xl text-gray-900 text-base font-medium transition-all duration-200 ease-in-out cursor-pointer shadow-sm hover:border-amber-400 hover:shadow-md focus:border-amber-500 focus:ring-4 focus:ring-amber-100 focus:shadow-lg outline-none text-left pr-12">
                    <span className="block truncate">
                        {selectedUnit?.label || 'Seleccionar unidad'}
                        {selectedUnit?.fullName && (
                            <span className="text-gray-500 text-sm ml-2">
                                - {selectedUnit.fullName}
                            </span>
                        )}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-amber-600 transition-transform duration-200 ui-open:rotate-180" />
                    </span>
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-[100] w-full py-2 mt-1 overflow-auto text-base bg-amber-100 rounded-xl shadow-lg max-h-32 ring-1 ring-black ring-opacity-5 focus:outline-none border border-amber-200">
                        {units.map((unit) => (
                            <Listbox.Option
                                key={unit.value}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-3 px-4 transition-colors duration-200 ${active ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                                    } ${value === unit.value ? 'bg-amber-100 text-amber-900' : ''}`
                                }
                                value={unit.value}
                            >
                                {({ selected }) => (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{unit.label}</span>
                                            {unit.fullName && (
                                                <span className="text-gray-500 text-sm ml-2">- {unit.fullName}</span>
                                            )}
                                        </div>
                                        {selected && (
                                            <Check className="w-5 h-5 text-amber-600" />
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