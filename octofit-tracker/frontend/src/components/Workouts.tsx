// changed line -step 3
import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  const loadData = useCallback(
    () => getJson<Record<string, unknown>>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`),
    [],
  );

  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    loadData={loadData}
    collection="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItem={(workout) => <>{String(workout.title)}: {String(workout.focus)}. {String(workout.reason ?? '')}</>}
  />;
}
