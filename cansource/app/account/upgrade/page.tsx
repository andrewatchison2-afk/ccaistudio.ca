import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckoutButton } from '@/components/ui/CheckoutButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Upgrade Plan' }

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/upgrade')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isSupplier = profile.role === 'supplier'
  const defaultPlan = searchParams.plan ?? (isSupplier ? 'supplier_featured' : 'brand_pro')

  const isPro = profile.subscription_tier === 'brand_pro' && profile.subscription_status === 'active'
  const isFeatured = profile.subscription_tier === 'supplier_featured' && profile.subscription_status === 'active'
  const hasActiveSub = isPro || isFeatured

  return (
    <div className="page-container py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {hasActiveSub ? 'Manage Your Plan' : 'Upgrade Your Plan'}
        </h1>
        <p className="mt-3 text-gray-500">
          {hasActiveSub
            ? 'You have an active subscription.'
            : 'Unlock more from CanSource.'}
        </p>
      </div>

      {hasActiveSub ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-3">{isPro ? '🚀' : '⭐'}</div>
          <h2 className="text-xl font-bold text-gray-900">
            {isPro ? 'Brand Pro' : 'Supplier Featured'} — Active
          </h2>
          {profile.subscription_period_end && (
            <p className="text-sm text-gray-500 mt-2">
              Renews {new Date(profile.subscription_period_end).toLocaleDateString('en-CA')}
            </p>
          )}
          <div className="mt-6">
            <CheckoutButton mode="portal" label="Manage billing & cancel" />
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Brand Pro */}
          {!isSupplier && (
            <div className={`card p-6 ${defaultPlan === 'brand_pro' ? 'ring-2 ring-red-600' : ''}`}>
              <h2 className="font-semibold text-gray-900">Brand Pro</h2>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                $79<span className="text-base font-normal text-gray-400">/mo</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                {[
                  'Unlimited supplier views',
                  'Contact info revealed',
                  'Unlimited saves',
                  'View history',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <CheckoutButton mode="checkout" plan="brand_pro" label="Upgrade to Pro" className="w-full mt-6" />
            </div>
          )}

          {/* Supplier Featured */}
          {isSupplier && (
            <div className={`card p-6 ring-2 ring-amber-500`}>
              <h2 className="font-semibold text-gray-900">Supplier Featured</h2>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                $49<span className="text-base font-normal text-gray-400">/mo</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                {[
                  'Featured badge on listing',
                  'Top placement in search',
                  'Analytics dashboard',
                  'Highlighted in categories',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <CheckoutButton mode="checkout" plan="supplier_featured" label="Get Featured" className="w-full mt-6 border-amber-500 text-amber-700" variant="outline" />
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Payments processed securely by Stripe. Cancel anytime.
      </p>
    </div>
  )
}
