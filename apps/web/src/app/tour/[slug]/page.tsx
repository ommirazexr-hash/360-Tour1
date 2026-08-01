import type { Metadata } from 'next';
import { TourViewer } from './TourViewer';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getTourData(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/viewer/${slug}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTourData(slug);
  if (!data) return { title: 'Tour Not Found' };
  return {
    title: data.project.name,
    description: data.project.description || `Virtual tour by ${data.project.companyName || 'VirtualTour Platform'}`,
    openGraph: {
      title: data.project.name,
      description: data.project.description || '',
      images: data.branding?.coverUrl ? [{ url: data.branding.coverUrl }] : [],
    },
  };
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTourData(slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-white mb-2">Tour Not Found</h1>
          <p className="text-slate-400">This tour may have been unpublished or the URL is incorrect.</p>
        </div>
      </div>
    );
  }

  return <TourViewer data={data} />;
}
