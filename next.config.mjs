/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co.com',
      },
      {
        protocol: 'https',
        hostname: 'uskcutjjmtcbgezcfbfm.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'], // আধুনিক ফরম্যাট ব্যবহার করবে, ছবির সাইজ অনেক কমাবে
  },
};
export default nextConfig;
