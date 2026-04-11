'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProductCategory, CanadianProvince } from '@/types/database'
import { PROVINCE_LABELS } from '@/types/database'

type Props = {
  categories: ProductCategory[]
  supplier?: any
  userId: string
}

export function SupplierForm({ categories, supplier, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const existingCategoryIds: number[] =
    supplier?.supplier_categories?.map((sc: any) => sc.category_id) ?? []

  const [form, setForm] = useState({
    company_name: supplier?.company_name ?? '',
    province: supplier?.province ?? '',
    website: supplier?.website ?? '',
    description: supplier?.description ?? '',
    contact_email: supplier?.contact_email ?? '',
    contact_phone: supplier?.contact_phone ?? '',
    min_order_quantity: supplier?.min_order_quantity ?? '',
    lead_time_days: supplier?.lead_time_days ?? '',
    ships_internationally: supplier?.ships_internationally ?? false,
    usmca_compliant: supplier?.usmca_compliant ?? false,
    accepts_shopify_orders: supplier?.accepts_shopify_orders ?? false,
    selectedCategories: existingCategoryIds,
  })

  const update = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleCategory = (id: number) => {
    setForm(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(id)
        ? prev.selectedCategories.filter(c => c !== id)
        : [...prev.selectedCategories, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const payload = {
      profile_id: userId,
      company_name: form.company_name,
      province: form.province as CanadianProvince,
      website: form.website || null,
      description: form.description || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      min_order_quantity: form.min_order_quantity ? Number(form.min_order_quantity) : null,
      lead_time_days: form.lead_time_days ? Number(form.lead_time_days) : null,
      ships_internationally: form.ships_internationally,
      usmca_compliant: form.usmca_compliant,
      accepts_shopify_orders: form.accepts_shopify_orders,
      last_updated: new Date().toISOString(),
    }

    let supplierId: string

    if (supplier) {
      const { error: updateError } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', supplier.id)
      if (updateError) { setError(updateError.message); setLoading(false); return }
      supplierId = supplier.id
    } else {
      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert(payload)
        .select('id')
        .single()
      if (insertError) { setError(insertError.message); setLoading(false); return }
      supplierId = data.id
    }

    // Sync categories
    await supabase.from('supplier_categories').delete().eq('supplier_id', supplierId)
    if (form.selectedCategories.length > 0) {
      await supabase.from('supplier_categories').insert(
        form.selectedCategories.map(id => ({ supplier_id: supplierId, category_id: id }))
      )
    }

    setSuccess('Listing saved successfully!')
    setLoading(false)
    router.refresh()
  }

  const boolField = (field: keyof typeof form, label: string) => (
    <label key={field} className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        checked={form[field] as boolean}
        onChange={e => update(field, e.target.checked)}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Company Name *</label>
          <input
            type="text"
            required
            className="input"
            value={form.company_name}
            onChange={e => update('company_name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Province *</label>
          <select
            required
            className="input"
            value={form.province}
            onChange={e => update('province', e.target.value)}
          >
            <option value="">Select province</option>
            {Object.entries(PROVINCE_LABELS).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Website</label>
        <input
          type="url"
          className="input"
          placeholder="https://yourcompany.ca"
          value={form.website}
          onChange={e => update('website', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Describe what you supply, your specialties, and what makes you a great partner for Canadian e-commerce brands…"
          value={form.description}
          onChange={e => update('description', e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Contact Email (visible to Pro subscribers)</label>
          <input
            type="email"
            className="input"
            placeholder="orders@yourcompany.ca"
            value={form.contact_email}
            onChange={e => update('contact_email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Contact Phone</label>
          <input
            type="tel"
            className="input"
            placeholder="+1 (416) 555-0100"
            value={form.contact_phone}
            onChange={e => update('contact_phone', e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Minimum Order Quantity</label>
          <input
            type="number"
            min="0"
            className="input"
            placeholder="e.g. 50"
            value={form.min_order_quantity}
            onChange={e => update('min_order_quantity', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Lead Time (days)</label>
          <input
            type="number"
            min="0"
            className="input"
            placeholder="e.g. 14"
            value={form.lead_time_days}
            onChange={e => update('lead_time_days', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label mb-3">Capabilities</label>
        <div className="space-y-3">
          {boolField('usmca_compliant', 'USMCA Compliant')}
          {boolField('ships_internationally', 'Ships Internationally')}
          {boolField('accepts_shopify_orders', 'Accepts Shopify Orders')}
        </div>
      </div>

      <div>
        <label className="label mb-3">Product Categories</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                checked={form.selectedCategories.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-100">
          {success}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Saving…' : supplier ? 'Update Listing' : 'Create Listing'}
      </button>
    </form>
  )
}
