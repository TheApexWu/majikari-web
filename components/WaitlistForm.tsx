'use client'

import { useState, FormEvent } from 'react'

interface WaitlistFormProps {
  source?: string
  placeholder?: string
  buttonText?: string
  className?: string
  compact?: boolean
}

export default function WaitlistForm({
  source = 'landing',
  placeholder = 'your@email.com',
  buttonText = 'Join Waitlist',
  className = '',
  compact = false,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading') return

    setStatus('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })

      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message)
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Network error — try again')
    }
  }

  if (status === 'success') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span>✓</span>
          <span>{message}</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status === 'error') setStatus('idle')
        }}
        placeholder={placeholder}
        required
        className={`flex-1 px-4 ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none transition-colors`}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
      >
        {status === 'loading' ? '...' : buttonText}
      </button>
      {status === 'error' && (
        <p className="absolute mt-12 text-red-400 text-xs">{message}</p>
      )}
    </form>
  )
}
