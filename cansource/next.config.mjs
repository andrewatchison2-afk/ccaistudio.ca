/** @type {import('next').NextConfig} */
const nextConfig = {
  // All pages that use Supabase auth are dynamic — disable static prerendering
  // so the build succeeds without env vars present at build time.
  // Each page also exports `dynamic = 'force-dynamic'` for explicitness.
  experimental: {},
}

export default nextConfig;
