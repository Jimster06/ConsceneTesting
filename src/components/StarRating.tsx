'use client'

interface Props {
  value: number
  max?: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }

export function StarRating({ value, max = 5, onChange, size = 'md' }: Props) {
  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={`${
            i < value ? 'star-filled' : 'star-empty'
          } ${onChange ? 'cursor-pointer hover:star-filled' : 'cursor-default'} leading-none`}
          aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
