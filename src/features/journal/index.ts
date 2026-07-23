// Public surface (feature-module.md §exports): the journal grid the /journal
// route mounts, plus useJournal() so cook-finish can log a plate. Pure logic
// (add/sort/prune) stays feature-private behind the hook.
export { JournalScreen } from './JournalScreen';
export { useJournal, type AddEntryInput } from './useJournal';
export type { JournalEntry } from './journal.logic';
