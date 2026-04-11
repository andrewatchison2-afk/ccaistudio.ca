import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createClient()
  const [suppliersRes, categoriesRes] = await Promise.all([
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('product_categories').select('id', { count: 'exact', head: true }),
  ])
  return {
    suppliers: suppliersRes.count ?? 0,
    categories: categoriesRes.count ?? 0,
  }
}

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-red-50 to-white py-20 md:py-28">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span>🍁</span>
            <span>Built for Canadian e-commerce brands</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Tariffs are killing your margins.{' '}
            <span className="text-red-600">Source Canadian.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            CanSource is the vetted directory of Canadian suppliers built for Shopify brands.
            Find domestic suppliers, ditch the tariff headache, and ship faster.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/suppliers" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-red-100">
              Browse Canadian Suppliers
            </Link>
            <Link href="/signup?role=supplier" className="btn-secondary text-base px-8 py-3.5">
              List Your Business — Free
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.suppliers}+</div>
              <div className="text-sm text-gray-500 mt-1">Canadian suppliers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.categories}</div>
              <div className="text-sm text-gray-500 mt-1">product categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">10</div>
              <div className="text-sm text-gray-500 mt-1">provinces covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              The tariff problem is real — and it&apos;s getting worse
            </h2>
            <p className="mt-4 text-gray-500">
              Canadian e-commerce brands importing from the US and overseas are facing record-high tariffs
              and unpredictable supply chains. The answer is sourcing domestic.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📦',
                title: 'Eliminate cross-border tariffs',
                body: 'Products sourced within Canada cross zero borders. No duty, no customs delays, no surprise charges at the warehouse.',
              },
              {
                icon: '⚡',
                title: 'Faster lead times',
                body: 'Domestic suppliers mean days, not weeks. Less inventory risk, better cash flow, happier customers.',
              },
              {
                icon: '🇨🇦',
                title: 'Made-in-Canada story',
                body: "Canadian customers pay more for local. 'Made in Canada' is a competitive advantage your US competitors can't copy.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-center mb-14">
            How it works
          </h2>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="badge badge-pro mb-4">For Brands</div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Find your next supplier in minutes</h3>
              <ol className="space-y-5">
                {[
                  { n: '1', title: 'Search by product category & province', body: 'Filter by USMCA compliance, Shopify orders accepted, ships internationally, and more.' },
                  { n: '2', title: 'View vetted supplier profiles', body: 'See MOQs, lead times, certifications, and whether they can integrate with Shopify.' },
                  { n: '3', title: 'Unlock contact info with Pro', body: 'Free accounts get 5 views/month. Upgrade to Pro ($79/mo) for unlimited access and direct contact details.' },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center">{step.n}</div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{step.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{step.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8"><Link href="/signup" className="btn-primary">Start for free</Link></div>
            </div>
            <div>
              <div className="badge badge-featured mb-4">For Suppliers</div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Get discovered by Canadian brands</h3>
              <ol className="space-y-5">
                {[
                  { n: '1', title: 'Create a free listing in 5 minutes', body: 'Add your products, provinces, MOQ, lead time, and certifications.' },
                  { n: '2', title: 'Get found by Shopify brands', body: 'Brands actively searching for domestic suppliers will find you in the directory.' },
                  { n: '3', title: 'Upgrade to Featured for more visibility', body: 'Featured badge + top placement + dashboard analytics for $49/month.' },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">{step.n}</div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{step.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{step.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8"><Link href="/signup?role=supplier" className="btn-outline">List your business free</Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">For Brands</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="card p-6">
                  <div className="font-semibold text-gray-900">Free</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">$0<span className="text-base font-normal text-gray-400">/mo</span></div>
                  <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                    {['5 supplier views per month', 'Filter by province & category', 'Save up to 10 suppliers'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="btn-secondary w-full mt-6 text-sm">Get started</Link>
                </div>
                <div className="card p-6 ring-2 ring-red-600 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most popular</span>
                  </div>
                  <div className="font-semibold text-gray-900">Pro</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">$79<span className="text-base font-normal text-gray-400">/mo</span></div>
                  <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                    {['Unlimited supplier views', 'Contact info revealed (email + phone)', 'Unlimited saves', 'View history & supplier notes', 'Priority support'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup?tier=brand_pro" className="btn-primary w-full mt-6 text-sm">Start Pro</Link>
                </div>
              </div>
            </div>
            <div id="supplier-pricing">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">For Suppliers</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="card p-6">
                  <div className="font-semibold text-gray-900">Free Listing</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">$0<span className="text-base font-normal text-gray-400">/mo</span></div>
                  <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                    {['Listed in the directory', 'Full profile page', 'Brand inquiries via contact form'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup?role=supplier" className="btn-secondary w-full mt-6 text-sm">List for free</Link>
                </div>
                <div className="card p-6 ring-2 ring-amber-500 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">More leads</span>
                  </div>
                  <div className="font-semibold text-gray-900">Featured</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">$49<span className="text-base font-normal text-gray-400">/mo</span></div>
                  <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
                    {['Featured badge on listing', 'Top placement in search results', 'Profile view analytics dashboard', 'Highlighted in category pages'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup?role=supplier&tier=supplier_featured" className="btn-outline w-full mt-6 text-sm border-amber-500 text-amber-700 hover:bg-amber-50">Get Featured</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-red-600">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to find your Canadian supplier?
          </h2>
          <p className="mt-4 text-red-100 text-lg max-w-xl mx-auto">
            Join hundreds of Canadian Shopify brands already sourcing domestic and protecting their margins.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/suppliers" className="bg-white text-red-600 font-medium px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm">
              Browse the directory
            </Link>
            <Link href="/signup" className="border border-red-300 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
