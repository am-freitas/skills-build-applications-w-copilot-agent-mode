
import { useCallback } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  const loadData = useCallback(() => getJson<Record<string, unknown>>('/api/teams'), []);

  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    loadData={loadData}
    collection="teams"
    emptyMessage="No teams yet."
    renderItem={(team) => <>{String(team.name)} ({Array.isArray(team.members) ? team.members.length : 0} members)</>}
  />;
}
