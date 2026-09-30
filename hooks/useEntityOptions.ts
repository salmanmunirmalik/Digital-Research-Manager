import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../utils/apiBase';

export type EntityOption = {
  id: string;
  label: string;
  meta?: string;
};

const authHeaders = () => getAuthHeaders();

const asList = (payload: unknown, keys: string[]): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
};

export async function fetchProtocolOptions(): Promise<EntityOption[]> {
  const response = await axios.get('/api/protocols', {
    headers: authHeaders(),
    params: { limit: 200 },
  });
  const rows = asList(response.data, ['protocols', 'data', 'items']);
  return rows
    .map((row) => ({
      id: String(row.id),
      label: String(row.title || row.name || 'Untitled protocol'),
      meta: row.category || row.research_area || undefined,
    }))
    .filter((row) => row.id);
}

export async function fetchExperimentOptions(): Promise<EntityOption[]> {
  const response = await axios.get('/api/experiments', {
    headers: authHeaders(),
  });
  const rows = asList(response.data, ['experiments', 'data', 'items']);
  // API may return a bare array
  const list = rows.length ? rows : asList(response.data, []);
  const source = Array.isArray(response.data) ? response.data : list;
  return (source as any[])
    .map((row) => ({
      id: String(row.id),
      label: String(row.title || row.name || 'Untitled experiment'),
      meta: row.status || undefined,
    }))
    .filter((row) => row.id);
}

export async function fetchNotebookOptions(): Promise<EntityOption[]> {
  const response = await axios.get('/api/lab-notebooks', {
    headers: authHeaders(),
  });
  const rows = asList(response.data, ['entries', 'data', 'items']);
  return rows
    .map((row) => ({
      id: String(row.id),
      label: String(row.title || 'Untitled note'),
      meta: row.entry_type || undefined,
    }))
    .filter((row) => row.id);
}

export function useEntityOptions(kinds: Array<'protocols' | 'experiments' | 'notebook'>) {
  const [protocols, setProtocols] = useState<EntityOption[]>([]);
  const [experiments, setExperiments] = useState<EntityOption[]>([]);
  const [notebookEntries, setNotebookEntries] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const kindsKey = kinds.slice().sort().join(',');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const want = new Set(kindsKey.split(',').filter(Boolean));
      const tasks: Promise<void>[] = [];
      if (want.has('protocols')) {
        tasks.push(
          fetchProtocolOptions()
            .then(setProtocols)
            .catch(() => setProtocols([]))
        );
      }
      if (want.has('experiments')) {
        tasks.push(
          fetchExperimentOptions()
            .then(setExperiments)
            .catch(() => setExperiments([]))
        );
      }
      if (want.has('notebook')) {
        tasks.push(
          fetchNotebookOptions()
            .then(setNotebookEntries)
            .catch(() => setNotebookEntries([]))
        );
      }
      await Promise.all(tasks);
    } finally {
      setLoading(false);
    }
  }, [kindsKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { protocols, experiments, notebookEntries, loading, reload };
}
