import { getToken } from './auth'
import type { DocumentSchema } from './types'

const BASE_PATH = (process.env.NEXT_PUBLIC_BASEPATH ?? '').replace(/\/$/, '')

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...options, headers })
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_PATH}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { detail?: string }).detail || 'Invalid credentials')
  }
  const data = await res.json() as { access_token: string }
  return data.access_token
}

export async function fetchSchema(): Promise<DocumentSchema> {
  const res = await authFetch(`${BASE_PATH}/api/v1/documents/schema`)
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error('Failed to load document types')
  return res.json() as Promise<DocumentSchema>
}

export async function generateDocument(
  payload: Record<string, string>
): Promise<{ blob: Blob; filename: string }> {
  const res = await authFetch(`${BASE_PATH}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { detail?: string }).detail || 'Document generation failed')
  }
  const cd = res.headers.get('Content-Disposition') ?? ''
  const match = cd.match(/filename="?([^";]+)"?/)
  const filename = match ? match[1] : 'document.docx'
  const blob = await res.blob()
  return { blob, filename }
}
