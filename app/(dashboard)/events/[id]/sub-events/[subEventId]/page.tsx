import { SubEventClient } from './client';

// Define proper PageProps type for Next.js dynamic route
interface PageProps {
  params: Promise<{
    id: string;
    subEventId: string;
  }>;
}

// Main page component with async/await for params
export default async function SubEventPage({ params }: PageProps) {
  // Resolve params using async/await
  const { id, subEventId } = await params;

  return <SubEventClient eventId={id} subEventId={subEventId} />;
}