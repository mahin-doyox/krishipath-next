import './globals.css';
import { Noto_Sans_Bengali } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import { createClient } from '@/lib/supabase/server';

// variable: '--font-noto' মুছে দেওয়া হয়েছে
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'কৃষিপথ',
  description: 'কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম',
  openGraph: {
    title: 'কৃষিপথ',
    description: 'কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম',
    type: 'website',
    locale: 'bn_BD',
  },
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: ann } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  const announcementMessage = ann?.[0]?.message || null;

  return (
    <html lang="bn">
      <head>
        <meta name="theme-color" content="#0d2e1d" />
        {/* গুগল ফন্টের <link> ট্যাগগুলো মুছে ফেলা হয়েছে কারণ Next.js নিজেই ফন্ট লোড করবে */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
      </head>
      {/* এখানে className ব্যবহার করে ফন্টটি পুরো বডিতে অ্যাপ্লাই করা হলো */}
      <body className={notoSansBengali.className}>
        <AuthProvider>
          <Navbar />
          <AnnouncementPopup message={announcementMessage} />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
