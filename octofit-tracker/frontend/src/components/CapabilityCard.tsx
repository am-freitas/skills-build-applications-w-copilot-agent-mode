import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Item = Record<string, unknown>;
type Props = {
  title: string;
  description: string;
  path: string;
  collection: string;
  emptyMessage: string;
  renderItem: (item: Item, index: number) => ReactNode;
};
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Item[] };

export function CapabilityCard({ title, description, path, collection, emptyMessage, renderItem }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<Record<string, unknown>>(path)
      .then((response) => {
        const data = response[collection];
        if (!Array.isArray(data)) throw new Error('Unexpected API response');
        const items = data.filter((item): item is Item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (active) setState({ status: 'ready', items });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (active) setState({ status: 'error', message });
      });
    return () => { active = false; };
  }, [collection, path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
    {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
    {state.status === 'ready' && state.items.length === 0 && <p>{emptyMessage}</p>}
    {state.status === 'ready' && state.items.length > 0 && <ul className="mb-0">
      {state.items.map((item, index) => <li key={String(item._id ?? `${collection}-${index}`)}>{renderItem(item, index)}</li>)}
    </ul>}
  </div></section>;
}
