import PricesClient from './PricesClient';

export const metadata = {
  title: 'বাজার দর - কৃষিপথ',
  description: 'এলাকাভিত্তিক কৃষি পণ্যের বাজার মূল্য',
};

export default function PricesPage() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">বাজার দর (এলাকাভিত্তিক)</h2>
      <PricesClient />
    </div>
  );
}