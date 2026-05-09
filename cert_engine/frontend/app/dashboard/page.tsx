'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, clearToken } from '../../lib/auth'
import { fetchSchema, generateDocument } from '../../lib/api'
import { Sidebar } from '../../components/Sidebar'
import { DocumentForm } from '../../components/DocumentForm'
import { ToastContainer } from '../../components/Toast'
import type { DocumentSchema, DocTypeSchema, Toast } from '../../lib/types'

let toastCounter = 0

export default function DashboardPage() {
  const router = useRouter()
  const [schema, setSchema] = useState<DocumentSchema | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sessionExpired, setSessionExpired] = useState(false)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = String(++toastCounter)
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleLogout = useCallback(() => {
    clearToken()
    router.push('/login')
  }, [router])

  const handleUnauthorized = useCallback(() => {
    clearToken()
    setSessionExpired(true)
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.push('/login')
      return
    }
    fetchSchema()
      .then(setSchema)
      .catch((err: Error) => {
        if (err.message === 'unauthorized') handleUnauthorized()
        else addToast('error', 'Failed to load document types')
      })
  }, [router, addToast, handleUnauthorized])

  const handleSelect = useCallback((module: string, docType: string) => {
    setSelectedModule(module)
    setSelectedDocType(docType)
  }, [])

  const handleGenerate = useCallback(
    async (payload: Record<string, string>) => {
      setIsGenerating(true)
      try {
        const { blob, filename } = await generateDocument(payload)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        addToast('success', `${filename} downloaded successfully`)
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'unauthorized') handleUnauthorized()
          else addToast('error', err.message)
        }
      } finally {
        setIsGenerating(false)
      }
    },
    [addToast, handleUnauthorized]
  )

  const selectedSchema: DocTypeSchema | null =
    selectedModule && selectedDocType && schema
      ? (schema.modules[selectedModule]?.[selectedDocType] ?? null)
      : null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        schema={schema}
        selectedModule={selectedModule}
        selectedDocType={selectedDocType}
        onSelect={handleSelect}
        onLogout={handleLogout}
      />

      <main className="flex-1 ml-64 overflow-y-auto">
        {selectedSchema && selectedDocType ? (
          <div className="max-w-4xl mx-auto p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1 capitalize">
                {selectedModule}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDocType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <DocumentForm
                key={`${selectedModule}-${selectedDocType}`}
                schema={selectedSchema}
                onGenerate={handleGenerate}
                isLoading={isGenerating}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {schema ? 'Select a document type' : 'Loading…'}
              </h3>
              <p className="text-gray-400 text-sm">
                {schema ? 'Choose from the sidebar to get started' : 'Fetching available templates'}
              </p>
            </div>
          </div>
        )}
      </main>

      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your session has expired. Please sign out and log in again to continue.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Sign Out &amp; Login
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
