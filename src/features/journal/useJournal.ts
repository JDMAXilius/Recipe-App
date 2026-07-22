import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { kv } from '@/shared/storage';
import type { PickedImage } from '@/shared/imagePicker';
import { addEntry as addToList, sortNewestFirst, type JournalEntry } from './journal.logic';

// Device-local cooking journal (StoreKey 'journal'). Photos are file uris on
// THIS device only — no upload. Validate-before-trust on load, best-effort
// persist on write (kv swallows storage failures).
const entrySchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  title: z.string(),
  uri: z.string(),
  cookedAt: z.number(),
});
const journalSchema: z.ZodType<JournalEntry[]> = z.array(entrySchema);

export interface AddEntryInput {
  recipeId: string;
  title: string;
  image: PickedImage;
  cookedAt?: number;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void kv.get<JournalEntry[]>('journal', [], journalSchema).then((loaded) => {
      if (!active) return;
      setEntries(sortNewestFirst(loaded));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const addEntry = useCallback((input: AddEntryInput) => {
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recipeId: input.recipeId,
      title: input.title,
      uri: input.image.uri,
      cookedAt: input.cookedAt ?? Date.now(),
    };
    setEntries((prev) => {
      const next = addToList(prev, entry);
      void kv.set('journal', next);
      return next;
    });
  }, []);

  return { entries, loading, addEntry };
}
