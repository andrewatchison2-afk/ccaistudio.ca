import { createClient } from '@/lib/supabase/server'
import { SupplierCard } from '@/components/suppliers/SupplierCard'
import { SearchFilters } from '@/components/suppliers/SearchFilters'
import { PROVINCE_LABELS as PROV, type CanadianProvince } from '@/types/database'

export const dynamic = 'force-dynamic'

type SearchParams = {
  search?: string
  province?: string
  category?: string
  usmca?: string
  ships_internationally?: string
  accepts_shopify?: string
}

async function getSuppliers(params: SearchParams) {
  const supabase = createClient()

  let query = supabase
    .from('suppliers')
    .select(`
      id, company_name, province, website, description, logo_url, slug,
      min_order_quantity, lead_time_days, ships_internationally, usmca_compliant,
      accepts_shopify_orders, is_verified, is_featured, last_updated, created_at,
      supplier_categories(
        product_categories(name)
      )
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (params.province) {
    query = query.eq('province', params.province)
  }
  if (params.usmca === 'true') {
    query = query.eq('usmca_compliant', true)
  }
  if (params.ships_internationally === 'true') {
    query = query.eq('ships_internationally', true)
  }
  if (params.accepts_shopify === 'true') {
    query = query.eq('accepts_shopify_orders', true)
  }

  const { data, error } = await query.limit(60)
  if (error) return []

  // Flatten categories and apply search client-side (for simplicity; use pg_trgm in prod)
  let suppliers = (data ?? []).map((s: any) => ({
    ...s,
    categories: s.supplier_categories
      ?.map((sc: any) => sc.product_categories?.name)
      .filter(Boolean) ?? [],
  }))

  if (params.search) {
    const q = params.search.toLowerCase()
    suppliers = suppliers.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.categories.some((c: string) => c.toLowerCase().includes(q))
    )
  }

  if (params.category) {
    suppliers = suppliers.filter((s) =>
      s.categories.some((c: string) =>
        c.toLowerCase() === params.category!.toLowerCase()
      )
    )
  }

  return suppliers
}

async function getCategories() {
  const supabase = createClient()
  const { data } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .order('name')
  return data ?? []
}

export const metadata = {
  title: 'Find Canadian Suppliers',
  description: 'Browse vetted Canadian suppliers for your Shopify store.',
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [suppliers, categories] = await Promise.all([
    getSuppliers(searchParams),
    getCategories(),
  ])

  const activeProvince = searchParams.province ?? ''
  const activeCategory = searchParams.category ?? ''

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Canadian Supplier Directory</h1>
        <p className="mt-2 text-gray-500">
          {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} found
          {activeProvince ? ` in ${PROV[activeProvince as CanadianProvince] ?? activeProvince}` : ''}
          {activeCategory ? ` · ${activeCategory}` : ''}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <SearchFilters
            categories={categories}
            initialValues={searchParams}
          />
        </aside>

        {/* Results */}
        <div className="flex-1">
          {suppliers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-4">🔍</div>
              <p className="font-medium text-gray-600">No suppliers found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
