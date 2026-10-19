
import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  const loadData = useCallback(() => getJson<Record<string, unknown>>('/api/leaderboard'), []);

  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    loadData={loadData}
    collection="leaderboard"
    emptyMessage="No leaderboard scores yet."
    renderItem={(entry) => <>#{String(entry.rank)} {String(entry.teamName)}: {String(entry.totalPoints)} points</>}
  />;
}
