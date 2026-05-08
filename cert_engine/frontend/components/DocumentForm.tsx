'use client'

import { useState, useMemo } from 'react'
import type { DocTypeSchema } from '@/lib/types'

const PAYSLIP_TEMPLATE = 'payslip_sample.docx'

const PAYSLIP_COMPONENTS = ['basic', 'hra', 'conv', 'med', 'bonus', 'spec'] as const
type PayslipComponent = (typeof PAYSLIP_COMPONENTS)[number]

const COMPONENT_LABELS: Record<PayslipComponent, string> = {
  basic: 'Basic',
  hra: 'HRA',
  conv: 'Conveyance',
  med: 'Medical',
  bonus: 'Bonus',
  spec: 'Special Allowance',
}

interface FieldMeta {
  label: string
  type: string
  options?: string[]
}

const FIELD_META: Record<string, FieldMeta> = {
  name: { label: 'Full Name', type: 'text' },
  gender: { label: 'Gender', type: 'select', options: ['male', 'female'] },
  date: { label: 'Issue Date', type: 'date' },
  from_date: { label: 'From Date', type: 'date' },
  to_date: { label: 'To Date', type: 'date' },
  domain: { label: 'Domain', type: 'text' },
  course_name: { label: 'Course Name', type: 'text' },
  project_name: { label: 'Project Name', type: 'text' },
  email: { label: 'Email', type: 'email' },
  phone_number: { label: 'Phone Number', type: 'tel' },
  job_role: { label: 'Job Role', type: 'text' },
  relieving_date: { label: 'Relieving Date', type: 'date' },
  key_responsibilities: { label: 'Key Responsibilities', type: 'textarea' },
  tools_technologies: { label: 'Tools & Technologies', type: 'text' },
  month_year: { label: 'Month & Year', type: 'month' },
  join_date: { label: 'Date of Joining', type: 'date' },
  designation: { label: 'Designation', type: 'text' },
  department: { label: 'Department', type: 'text' },
  location: { label: 'Location', type: 'text' },
  bank_name: { label: 'Bank Name', type: 'text' },
  bank_acc_no: { label: 'Account Number', type: 'text' },
  branch: { label: 'Branch', type: 'text' },
  ifsc_code: { label: 'IFSC Code', type: 'text' },
  pan_no: { label: 'PAN Number', type: 'text' },
  lop: { label: 'LOP (Days)', type: 'number' },
}

function fieldLabel(field: string): string {
  return (
    FIELD_META[field]?.label ??
    field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function getDaysInMonth(monthYear: string): number {
  if (!monthYear) return 0
  const [year, month] = monthYear.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'

interface DocumentFormProps {
  schema: DocTypeSchema
  onGenerate: (payload: Record<string, string>) => Promise<void>
  isLoading: boolean
}

export function DocumentForm({ schema, onGenerate, isLoading }: DocumentFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf'>('docx')

  const isPayslip = schema.template_file === PAYSLIP_TEMPLATE

  const computed = useMemo(() => {
    if (!isPayslip) return {}
    const days = getDaysInMonth(values.month_year ?? '')
    const totFull = PAYSLIP_COMPONENTS.reduce(
      (sum, c) => sum + (parseFloat(values[`${c}_full`] ?? '0') || 0),
      0
    )
    const totActual = PAYSLIP_COMPONENTS.reduce(
      (sum, c) => sum + (parseFloat(values[`${c}_actual`] ?? '0') || 0),
      0
    )
    const net = Math.max(0, totActual - 200)
    return {
      days_in_month: String(days || ''),
      total_full: totFull.toFixed(2),
      total_actual: totActual.toFixed(2),
      net_total: net.toFixed(2),
    }
  }, [isPayslip, values])

  const allValues: Record<string, string> = { ...values, ...(computed as Record<string, string>) }

  const set = (field: string, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onGenerate({
      ...allValues,
      template_name: schema.template_file,
      export_format: exportFormat,
    } as Record<string, string>)
  }

  const renderField = (field: string, readOnly = false) => {
    const meta = FIELD_META[field]
    const value = allValues[field] ?? ''
    const label = fieldLabel(field)
    const isReadOnly = readOnly || computed[field as keyof typeof computed] !== undefined

    if (meta?.type === 'select' && meta.options) {
      return (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <select
            value={value}
            onChange={(e) => set(field, e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select…</option>
            {meta.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (meta?.type === 'textarea') {
      return (
        <div key={field} className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            value={value}
            onChange={(e) => set(field, e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            required
          />
        </div>
      )
    }

    return (
      <div key={field}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={meta?.type ?? 'text'}
          value={value}
          onChange={(e) => set(field, e.target.value)}
          readOnly={isReadOnly}
          className={`${inputClass} ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-default' : ''}`}
          required={!isReadOnly}
        />
      </div>
    )
  }

  if (schema.required_fields.length === 0) {
    return (
      <div className="text-center py-14 text-gray-400">
        <p className="text-sm">This template is coming soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {!isPayslip ? (
        <div className="grid grid-cols-2 gap-4">
          {schema.required_fields.map((f) => renderField(f))}
        </div>
      ) : (
        <>
          {/* Employee Info */}
          <section>
            <SectionTitle>Employee Information</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              {['name', 'month_year', 'join_date', 'designation', 'department', 'location']
                .filter((f) => schema.required_fields.includes(f))
                .map((f) => renderField(f))}
            </div>
          </section>

          {/* Bank Details */}
          <section>
            <SectionTitle>Bank Details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              {['bank_name', 'bank_acc_no', 'branch', 'ifsc_code', 'pan_no']
                .filter((f) => schema.required_fields.includes(f))
                .map((f) => renderField(f))}
            </div>
          </section>

          {/* Attendance */}
          <section>
            <SectionTitle>Attendance</SectionTitle>
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              {renderField('days_in_month', true)}
              {renderField('lop')}
            </div>
          </section>

          {/* Earnings Table */}
          <section>
            <SectionTitle>Earnings</SectionTitle>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-1/3">Component</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Full (CTC)</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PAYSLIP_COMPONENTS.map((comp) => (
                    <tr key={comp} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{COMPONENT_LABELS[comp]}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={values[`${comp}_full`] ?? ''}
                          onChange={(e) => set(`${comp}_full`, e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={values[`${comp}_actual`] ?? ''}
                          onChange={(e) => set(`${comp}_actual`, e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{computed.total_full || '0.00'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{computed.total_actual || '0.00'}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 font-semibold text-gray-900" colSpan={2}>
                      Net Total <span className="text-xs font-normal text-gray-500">(after ₹200 deduction)</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-base">{computed.net_total || '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Footer: format toggle + submit */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Format</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['docx', 'pdf'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  exportFormat === fmt
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </>
          ) : (
            'Generate Document'
          )}
        </button>
      </div>
    </form>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}
