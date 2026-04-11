'use client'

import Link from 'next/link'

type Props = {
  supplierId: string
  contactEmail: string | null
  contactPhone: string | null
  canView: boolean
  isPro: boolean
  isLoggedIn: boolean
  viewsUsed: number
  viewLimit: number
}

export function ContactReveal({
  contactEmail,
  contactPhone,
  canView,
  isPro,
  isLoggedIn,
  viewsUsed,
  viewLimit,
}: Props) {
  if (!isLoggedIn) {
    return (
      <div className="card p-5 text-center">
        <div className="text-2xl mb-2">🔒</div>
        <h3 className="font-semibold text-gray-900 mb-1">Contact Information</h3>
        <p className="text-sm text-gray-500 mb-4">Sign in to view supplier contact details</p>
        <Link href="/login" className="btn-primary w-full text-sm">Sign in</Link>
        <p className="text-xs text-gray-400 mt-3">No account? <Link href="/signup" className="underline">Sign up free</Link></p>
      </div>
    )
  }

  if (!canView && !isPro) {
    return (
      <div className="card p-5 text-center">
        <div className="text-2xl mb-2">📊</div>
        <h3 className="font-semibold text-gray-900 mb-1">Free tier limit reached</h3>
        <p className="text-sm text-gray-500 mb-1">
          You&apos;ve used {viewsUsed}/{viewLimit} supplier views this month.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Upgrade to Pro for unlimited access and contact info.
        </p>
        <Link href="/account/upgrade" className="btn-primary w-full text-sm">Upgrade to Pro — $79/mo</Link>
        <p className="text-xs text-gray-400 mt-3">Resets on the 1st of each month</p>
      </div>
    )
  }

  const hasContact = contactEmail || contactPhone

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        Contact Information
        {isPro && <span className="badge badge-pro text-xs">Pro</span>}
      </h3>
      {hasContact ? (
        <div className="space-y-3">
          {contactEmail && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide font-medium">Email</p>
              <a href={`mailto:${contactEmail}`} className="text-sm text-red-600 hover:underline font-medium">
                {contactEmail}
              </a>
            </div>
          )}
          {contactPhone && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wide font-medium">Phone</p>
              <a href={`tel:${contactPhone}`} className="text-sm text-red-600 hover:underline font-medium">
                {contactPhone}
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">This supplier hasn&apos;t added contact information yet.</p>
      )}
    </div>
  )
}
