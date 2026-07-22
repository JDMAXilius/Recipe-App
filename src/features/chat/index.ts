// Public surface of the chat feature (feature-module.md §exports): the screen
// (mounted by the ＋ create tab) plus the thread loader/type the
// Recent chats screen (app/chats.tsx) reads. Queries, hook internals, logic, and
// wire types stay feature-private.
export { ChatScreen } from './ChatScreen';
export { loadThreads, type ChatThread } from './useChat';
