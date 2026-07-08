import { useMemo, useState } from 'react';
import { normalizeForSearch } from '../../utils/normalize';

export function useLibrarySearch<T>(items: T[], matcher: (item: T, normalizedQuery: string) => boolean) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const normalizedQuery = normalizeForSearch(query);
    return items.filter((item) => matcher(item, normalizedQuery));
  }, [items, query, matcher]);

  return { query, setQuery, filtered };
}