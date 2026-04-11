import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="page-container py-20 text-center">
      <div className="text-6xl mb-4">🍁</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">Sorry, we couldn&apos;t find what you were looking for.</p>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  )
}
