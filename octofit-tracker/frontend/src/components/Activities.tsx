// changed line -step 3
import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  const loadData = useCallback(() => getJson<Record<string, unknown>>('/api/activities'), []);

  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    loadData={loadData}
    collection="activities"
    emptyMessage="No activities yet."
    renderItem={(activity) => <>{String(activity.type)}: {String(activity.minutes)} minutes, {String(activity.points)} points</>}
  />;
}
