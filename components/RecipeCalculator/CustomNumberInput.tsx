"use client"

import { useState, useRef, useEffect } from "react"

interface CustomNumberInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    placeholder?: string
    className?: string
    allowDecimals?: boolean  // Add this prop
    color?: string  // Single color prop for all styling
}

export function CustomNumberInput({
    value,
    onChange,
    min = 0,
    max = 10000,
    placeholder,
    className,
    allowDecimals = true,  // Default to true for backward compatibility
    color = "amber"  // Default color
}: CustomNumberInputProps) {
    const [displayValue, setDisplayValue] = useState(
        value && value !== 0 ? value.toString() : ''
    )
    const [cursorPosition, setCursorPosition] = useState(0)
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const displayRef = useRef<HTMLDivElement>(null)

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue':
                return {
                    bg50: 'bg-blue-50',
                    bg100: 'bg-blue-100',
                    bg200: 'bg-blue-200',
                    text700: 'text-blue-700',
                    text800: 'text-blue-800',
                    text900: 'text-blue-900',
                    border200: 'border-blue-200',
                    decoration500: 'decoration-blue-500'
                }
            case 'purple':
                return {
                    bg50: 'bg-purple-50',
                    bg100: 'bg-purple-100',
                    bg200: 'bg-purple-200',
                    text700: 'text-purple-700',
                    text800: 'text-purple-800',
                    text900: 'text-purple-900',
                    border200: 'border-purple-200',
                    decoration500: 'decoration-purple-500'
                }
            case 'gray':
                return {
                    bg50: 'bg-gray-50',
                    bg100: 'bg-gray-100',
                    bg200: 'bg-gray-200',
                    text700: 'text-gray-700',
                    text800: 'text-gray-800',
                    text900: 'text-gray-900',
                    border200: 'border-gray-200',
                    decoration500: 'decoration-gray-500'
                }
            case 'red':
                return {
                    bg50: 'bg-red-50',
                    bg100: 'bg-red-100',
                    bg200: 'bg-red-200',
                    text700: 'text-red-700',
                    text800: 'text-red-800',
                    text900: 'text-red-900',
                    border200: 'border-red-200',
                    decoration500: 'decoration-red-500'
                }
            case 'green':
                return {
                    bg50: 'bg-green-50',
                    bg100: 'bg-green-100',
                    bg200: 'bg-green-200',
                    text700: 'text-green-700',
                    text800: 'text-green-800',
                    text900: 'text-green-900',
                    border200: 'border-green-200',
                    decoration500: 'decoration-green-500'
                }
            default: // amber
                return {
                    bg50: 'bg-amber-50',
                    bg100: 'bg-amber-100',
                    bg200: 'bg-amber-200',
                    text700: 'text-amber-700',
                    text800: 'text-amber-800',
                    text900: 'text-amber-900',
                    border200: 'border-amber-200',
                    decoration500: 'decoration-amber-500'
                }
        }
    }

    const colors = getColorClasses(color)

    const modifyDigitAtPosition = (str: string, pos: number, increment: number): string => {
        if (!str || pos < 0 || pos >= str.length) return str

        const chars = str.split('')
        const currentChar = chars[pos]

        if (currentChar === '.' && allowDecimals) {
            return modifyDigitAtPosition(str, pos + increment > 0 ? pos + 1 : pos - 1, increment)
        }

        if (/\d/.test(currentChar)) {
            const newDigit = parseInt(currentChar) + increment

            if (newDigit > 9) {
                chars[pos] = '0'
                if (pos > 0) {
                    const leftPart = chars.slice(0, pos).join('')
                    const rightPart = chars.slice(pos).join('')
                    return modifyDigitAtPosition(leftPart, pos - 1, 1) + rightPart
                } else {
                    return '1' + chars.join('').slice(pos)
                }
            } else if (newDigit < 0) {
                chars[pos] = '9'
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

        // Use different regex based on allowDecimals
        const regex = allowDecimals ? /^(\d*\.?\d*)$/ : /^\d*$/

        if (regex.test(newValue)) {
            setDisplayValue(newValue)
            const numValue = newValue && newValue !== '0' ? parseFloat(newValue) : 0
            onChange(Math.max(min, Math.min(max, numValue)))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent decimal point if decimals not allowed
        if (!allowDecimals && e.key === '.') {
            e.preventDefault()
            return
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()

            const currentStr = displayValue || '0'
            const increment = e.key === 'ArrowUp' ? 1 : -1

            const newStr = modifyDigitAtPosition(currentStr, cursorPosition, increment)
            const newNum = newStr ? parseFloat(newStr) : 0
            const clampedNum = Math.max(min, Math.min(max, newNum))

            setDisplayValue(clampedNum.toString())
            onChange(clampedNum)

            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
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

    const handleDisplayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (inputRef.current) {
            inputRef.current.focus()

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

                requestAnimationFrame(() => {
                    if (inputRef.current) {
                        inputRef.current.setSelectionRange(clickedPosition, clickedPosition)
                    }
                })
            }
        }
    }

    const renderDisplayValue = () => {
        const valueToRender = displayValue || (isFocused ? '0' : '')
        if (!valueToRender) return ''

        const chars = valueToRender.split('')
        return chars.map((char, index) => {
            // Don't highlight decimal point if it's not allowed (shouldn't happen but just in case)
            if (index === cursorPosition && /\d/.test(char) && isFocused) {
                return (
                    <span key={index} className={`underline decoration-2 ${colors.decoration500} ${colors.bg200} ${colors.text900} px-0.5 rounded`}>
                        {char}
                    </span>
                )
            }
            return char
        })
    }

    useEffect(() => {
        setDisplayValue(value && value !== 0 ? value.toString() : '')
    }, [value])

    return (
        <div className={`flex items-center min-h-12.5 w-full rounded-md ${colors.bg50} ${className || ''}`}>
            <button
                type="button"
                className={`w-6 h-full min-h-12.5 min-w-8 flex items-center justify-center ${colors.bg200} ${colors.text700} 
                            rounded-l-md border-r-2 ${colors.border200} hover:${colors.bg100} active:${colors.bg200} 
                            transition-colors duration-150 group`}
                onClick={(e) => {
                    e.preventDefault();
                    const currentStr = displayValue || '0';
                    const newStr = modifyDigitAtPosition(currentStr, cursorPosition, -1);
                    const newNum = newStr ? parseFloat(newStr) : 0;
                    const clampedNum = Math.max(min, Math.min(max, newNum));
                    setDisplayValue(clampedNum.toString());
                    onChange(clampedNum);

                    requestAnimationFrame(() => {
                        if (inputRef.current) {
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                        }
                    });
                }}
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            </button>

            <div className="relative flex-1 min-w-10 " onClick={handleDisplayClick}>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode={allowDecimals ? "decimal" : "numeric"}
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSelect={handleSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                />

                <div
                    ref={displayRef}
                    onClick={handleDisplayClick}
                    className="w-full h-full flex items-center justify-center px-2 py-1 overflow-hidden"
                >
                    {displayValue || (isFocused && '0') ? (
                        <span className={`font-bold ${colors.text800} select-none pointer-events-none text-sm sm:text-base truncate`}>
                            {renderDisplayValue()}
                        </span>
                    ) : (
                        <span className={`text-gray-800/50 select-none pointer-events-none text-sm sm:text-base truncate`}>{placeholder}</span>
                    )}
                </div>
            </div>

            <button
                type="button"
                className={`w-6 h-full min-h-12.5 min-w-8 flex items-center justify-center 
                ${colors.bg200} ${colors.text700} rounded-r-md border-l-2 ${colors.border200} 
                hover:${colors.bg100} active:${colors.bg200} transition-colors duration-150 group`}
                onClick={(e) => {
                    e.preventDefault();
                    const currentStr = displayValue || '0';
                    const newStr = modifyDigitAtPosition(currentStr, cursorPosition, 1);
                    const newNum = newStr ? parseFloat(newStr) : 0;
                    const clampedNum = Math.max(min, Math.min(max, newNum));
                    setDisplayValue(clampedNum.toString());
                    onChange(clampedNum);

                    requestAnimationFrame(() => {
                        if (inputRef.current) {
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                        }
                    });
                }}
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    )
}