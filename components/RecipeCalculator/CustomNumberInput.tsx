"use client"

import { useState, useRef, useEffect } from "react"

interface CustomNumberInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    placeholder?: string
}

export function CustomNumberInput({
    value,
    onChange,
    min = 0,
    max = 10000,
    placeholder
}: CustomNumberInputProps) {
    const [displayValue, setDisplayValue] = useState(value?.toString() || '')
    const [cursorPosition, setCursorPosition] = useState(0)
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const displayRef = useRef<HTMLDivElement>(null)

    // Increment/decrement the digit at cursor position
    const modifyDigitAtPosition = (str: string, pos: number, increment: number): string => {
        if (!str || pos < 0 || pos >= str.length) return str

        const chars = str.split('')
        const currentChar = chars[pos]

        // Skip decimal point
        if (currentChar === '.') {
            return modifyDigitAtPosition(str, pos + increment > 0 ? pos + 1 : pos - 1, increment)
        }

        // Handle digits
        if (/\d/.test(currentChar)) {
            const newDigit = parseInt(currentChar) + increment

            // Handle carry-over
            if (newDigit > 9) {
                chars[pos] = '0'
                // Recursively handle carry to left
                if (pos > 0) {
                    const leftPart = chars.slice(0, pos).join('')
                    const rightPart = chars.slice(pos).join('')
                    return modifyDigitAtPosition(leftPart, pos - 1, 1) + rightPart
                } else {
                    return '1' + chars.join('').slice(pos)
                }
            } else if (newDigit < 0) {
                chars[pos] = '9'
                // Recursively handle borrow from left
                if (pos > 0) {
                    const leftPart = chars.slice(0, pos).join('')
                    const rightPart = chars.slice(pos).join('')
                    return modifyDigitAtPosition(leftPart, pos - 1, -1) + rightPart
                } else {
                    return chars.join('').slice(pos)
                }
            } else {
                chars[pos] = newDigit.toString()
                return chars.join('')
            }
        }

        return str
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        if (/^(\d*\.?\d*)$/.test(newValue)) {
            setDisplayValue(newValue)
            const numValue = newValue && newValue !== '0' ? parseFloat(newValue) : 0
            onChange(Math.max(min, Math.min(max, numValue)))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()

            const currentStr = displayValue || '0'
            const increment = e.key === 'ArrowUp' ? 1 : -1

            const newStr = modifyDigitAtPosition(currentStr, cursorPosition, increment)
            const newNum = newStr ? parseFloat(newStr) : 0
            const clampedNum = Math.max(min, Math.min(max, newNum))

            setDisplayValue(clampedNum.toString())
            onChange(clampedNum)

            // FIX: Use requestAnimationFrame to ensure focus is maintained after state update
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
                    // Ensure focus is maintained
                    inputRef.current.focus()
                }
            })

        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            const newPosition = Math.max(0, cursorPosition - 1)
            setCursorPosition(newPosition)
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newPosition, newPosition)
            }

        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            const newPosition = Math.min(displayValue.length, cursorPosition + 1)
            setCursorPosition(newPosition)
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newPosition, newPosition)
            }

        } else if (e.key === 'Enter') {
            inputRef.current?.blur()
        }
    }

    const handleFocus = () => {
        setIsFocused(true)
        // If no value, set display to '0' temporarily
        if (!displayValue) {
            setDisplayValue('0')
        }
        // Only set cursor to position 0 if there's no existing selection/cursor position
        if (cursorPosition === 0 && inputRef.current) {
            inputRef.current.setSelectionRange(0, 0)
        }
    }

    const handleBlur = () => {
        setIsFocused(false)
    }

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const newPosition = e.currentTarget.selectionStart || 0
        setCursorPosition(newPosition)
    }

    // Handle click on visual display
    const handleDisplayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (inputRef.current) {
            inputRef.current.focus()

            // Calculate cursor position based on click
            const rect = displayRef.current?.getBoundingClientRect()
            if (rect) {
                const clickX = e.clientX - rect.left
                const text = displayValue || ''
                const avgCharWidth = rect.width / Math.max(1, text.length)
                const clickedPosition = Math.min(
                    text.length,
                    Math.max(0, Math.floor(clickX / avgCharWidth))
                )

                setCursorPosition(clickedPosition)

                // FIX: Use requestAnimationFrame to ensure the cursor position is set after focus
                requestAnimationFrame(() => {
                    if (inputRef.current) {
                        inputRef.current.setSelectionRange(clickedPosition, clickedPosition)
                    }
                })
            }
        }
    }

    // Create the display value with underlined digit
    const renderDisplayValue = () => {
        const valueToRender = displayValue || (isFocused ? '0' : '')
        if (!valueToRender) return ''

        const chars = valueToRender.split('')
        return chars.map((char, index) => {
            if (index === cursorPosition && /\d/.test(char) && isFocused) {
                return (
                    <span key={index} className="underline decoration-2 decoration-amber-500 bg-amber-200 text-amber-900 px-0.5 rounded">
                        {char}
                    </span>
                )
            }
            return char
        })
    }

    useEffect(() => {
        setDisplayValue(value === 0 ? '' : value.toString())
    }, [value])

    return (
        <div className="relative" onClick={handleDisplayClick}>
            {/* Hidden input for actual functionality */}
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                placeholder={placeholder}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSelect={handleSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
            />

            {/* Visual display with underlined digit */}
            <div
                ref={displayRef}
                onClick={handleDisplayClick}
                className={`px-4 py-3 border-2 rounded-lg text-base min-h-[3.5rem] flex items-center transition-colors duration-200 ${isFocused
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                    : 'border-amber-300 bg-white'
                    }`}
            >
                {displayValue || (isFocused && '0') ? (
                    <span className="font-mono text-gray-900 select-none pointer-events-none">
                        {renderDisplayValue()}
                    </span>
                ) : (
                    <span className="text-gray-400 select-none pointer-events-none">{placeholder}</span>
                )}
            </div>
        </div>
    )
}