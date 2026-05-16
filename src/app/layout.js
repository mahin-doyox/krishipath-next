import './globals.css';
import { Noto_Sans_Bengali } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import { createClient } from '@/lib/supabase/server';

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto',
});

export const metadata = {
  title: 'কৃষিপথ',
  description: 'কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম',
  openGraph: {
    title: 'কৃষিপথ',
    description: 'কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম',
    type: 'website',
    locale: 'bn_BD',
  },
  // 👇 একেবারে নিচে এই অংশটি যোগ করো
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
    <html lang="bn" className={notoSansBengali.variable}>
      <head>
        <meta name="theme-color" content="#0d2e1d" />
        {/* নিরাপত্তার জন্য এটি রেখে দিচ্ছি, উপরের metadata কাজ না করলে এটি কাজ করবে */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
      </head>
      <body>
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
