/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,   // <-- নতুন লাইন
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uskcutjjmtcbgezcfbfm.supabase.co',
      },
    ],
  },
};
export default nextConfig;