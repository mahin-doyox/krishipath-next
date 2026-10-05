/** @type {import('next').NextConfig} */
const nextConfig = {
  // removed `turbopack: false` (not a valid Next 14 option)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co.com' },
      { protocol: 'https', hostname: 'uskcutjjmtcbgezcfbfm.supabase.co' },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
export default nextConfig;
