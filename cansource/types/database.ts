// CanSource — Supabase database types

export type UserRole = 'brand' | 'supplier' | 'admin'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
export type SubscriptionTier = 'free' | 'brand_pro' | 'supplier_featured'
export type CanadianProvince =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU'
  | 'ON' | 'PE' | 'QC' | 'SK' | 'YT'

export const PROVINCE_LABELS: Record<CanadianProvince, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
}

export type Profile = {
  id: string
  role: UserRole
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_tier: SubscriptionTier
  subscription_id: string | null
  subscription_period_end: string | null
  created_at: string
  updated_at: string
}

export type ProductCategory = {
  id: number
  name: string
  slug: string
}

export type Supplier = {
  id: string
  profile_id: string
  company_name: string
  province: CanadianProvince
  website: string | null
  description: string | null
  logo_url: string | null
  slug: string | null
  min_order_quantity: number | null
  lead_time_days: number | null
  ships_internationally: boolean
  usmca_compliant: boolean
  accepts_shopify_orders: boolean
  contact_email: string | null   // null for free brand users (app-layer gating)
  contact_phone: string | null
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  last_updated: string
  created_at: string
}

// What the suppliers_public view returns (categories aggregated)
export type SupplierPublic = Omit<Supplier, 'contact_email' | 'contact_phone' | 'profile_id' | 'is_active'> & {
  categories: string[] | null
}

// Full supplier with categories (joined)
export type SupplierWithCategories = Supplier & {
  categories?: ProductCategory[]
  supplier_categories?: { category_id: number; product_categories: ProductCategory }[]
}

export type SavedSupplier = {
  brand_id: string
  supplier_id: string
  saved_at: string
  suppliers?: SupplierPublic
}

export type BrandSupplierView = {
  id: number
  brand_id: string
  supplier_id: string
  viewed_at: string
  suppliers?: Pick<Supplier, 'id' | 'company_name' | 'province' | 'slug' | 'is_verified' | 'is_featured'>
}

export type SupplierAnalytics = {
  supplier_id: string
  profile_id: string
  total_views: number
  views_last_30_days: number
  views_last_7_days: number
  total_saves: number
  last_viewed_at: string | null
}

// Search / filter params for the directory
export type SupplierFilters = {
  search?: string
  province?: CanadianProvince | ''
  category?: string
  usmca?: boolean
  ships_internationally?: boolean
  accepts_shopify?: boolean
  featured_first?: boolean
}

// Stripe price IDs (set in env)
export const STRIPE_PRICES = {
  brandPro: process.env.STRIPE_BRAND_PRO_PRICE_ID ?? '',
  supplierFeatured: process.env.STRIPE_SUPPLIER_FEATURED_PRICE_ID ?? '',
} as const

export const FREE_TIER_VIEW_LIMIT = 5
