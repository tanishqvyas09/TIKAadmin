import { SubEventClient } from './client';

export default function SubEventPage({ params }: { params: { id: string, subEventId: string } }) {
  return <SubEventClient eventId={params.id} subEventId={params.subEventId} />;
} 