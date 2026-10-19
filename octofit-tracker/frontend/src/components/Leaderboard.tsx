import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    collection="leaderboard"
    emptyMessage="No leaderboard scores yet."
    renderItem={(entry) => <>#{String(entry.rank)} {String(entry.teamName)}: {String(entry.totalPoints)} points</>}
  />;
}
