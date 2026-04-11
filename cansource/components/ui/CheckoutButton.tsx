'use client'

import { useState } from 'react'

type Props = {
  mode: 'checkout' | 'portal'
  plan?: 'brand_pro' | 'supplier_featured'
  label: string
  className?: string
  variant?: 'primary' | 'outline' | 'secondary'
}

export function CheckoutButton({ mode, plan, label, className = '', variant = 'primary' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const endpoint = mode === 'portal'
        ? '/api/stripe/portal'
        : '/api/stripe/checkout'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); setLoading(false); return }
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50'
  const variants = {
    primary: `${base} bg-red-600 text-white hover:bg-red-700`,
    outline: `${base} border-2 border-amber-500 text-amber-700 hover:bg-amber-50`,
    secondary: `${base} bg-white text-gray-700 border border-gray-200 hover:bg-gray-50`,
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${variants[variant]} ${className}`}
    >
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
