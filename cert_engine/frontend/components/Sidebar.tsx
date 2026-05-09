'use client'

import type { DocumentSchema } from '../lib/types'

interface SidebarProps {
  schema: DocumentSchema | null
  selectedModule: string | null
  selectedDocType: string | null
  onSelect: (module: string, docType: string) => void
  onLogout: () => void
}

export function Sidebar({ schema, selectedModule, selectedDocType, onSelect, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Document Engine</p>
            <p className="text-xs text-slate-400">HR & Student Docs</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {schema
          ? Object.entries(schema.modules).map(([module, docTypes]) => (
              <div key={module}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {module}
                </p>
                <div className="space-y-0.5">
                  {Object.keys(docTypes).map((docType) => {
                    const isActive = selectedModule === module && selectedDocType === docType
                    return (
                      <button
                        key={docType}
                        onClick={() => onSelect(module, docType)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-800 rounded-lg animate-pulse mx-2" />
            ))}
      </nav>

      <div className="p-3 border-t border-slate-700/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
