import PricesClient from './PricesClient';

export const metadata = {
  title: 'বাজার দর - কৃষিপথ',
  description: 'এলাকাভিত্তিক কৃষি পণ্যের বাজার মূল্য',
  openGraph: {
    title: 'বাজার দর - কৃষিপথ',
    description: 'এলাকাভিত্তিক কৃষি পণ্যের বাজার মূল্য',
  },
};

export default function PricesPage() {
  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title">বাজার দর (এলাকাভিত্তিক)</h2>
      <PricesClient />
    </div>
  );
}
