import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-bold text-red-600">Can</span>
              <span className="text-xl font-bold text-gray-900">Source</span>
              <span className="ml-1">🍁</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              The vetted directory of Canadian suppliers for Shopify brands navigating tariffs and domestic sourcing.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              © {new Date().getFullYear()} CanSource. All rights reserved.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Directory</h3>
            <ul className="space-y-2.5">
              <li><Link href="/suppliers" className="text-sm text-gray-500 hover:text-gray-700">Find Suppliers</Link></li>
              <li><Link href="/suppliers?usmca=true" className="text-sm text-gray-500 hover:text-gray-700">USMCA Compliant</Link></li>
              <li><Link href="/suppliers?ships_internationally=true" className="text-sm text-gray-500 hover:text-gray-700">Ships Internationally</Link></li>
              <li><Link href="/#pricing" className="text-sm text-gray-500 hover:text-gray-700">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Suppliers</h3>
            <ul className="space-y-2.5">
              <li><Link href="/signup?role=supplier" className="text-sm text-gray-500 hover:text-gray-700">List Your Business</Link></li>
              <li><Link href="/supplier/dashboard" className="text-sm text-gray-500 hover:text-gray-700">Supplier Dashboard</Link></li>
              <li><Link href="/#supplier-pricing" className="text-sm text-gray-500 hover:text-gray-700">Get Featured</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
