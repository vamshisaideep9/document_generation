'use client'

import { useEffect } from 'react'
import type { Toast } from '@/lib/types'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[toast.type]

  return (
    <div
      className={`${styles} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-72 max-w-sm pointer-events-auto animate-slide-in`}
    >
      <span className="flex-1 text-sm leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/70 hover:text-white shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
