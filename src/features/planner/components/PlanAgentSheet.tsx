// "Plan with Otto" (1.2, flags.agent): say what the week should be ("nothing
// over 30 minutes, tacos on Friday") and Otto changes the plan, then lists
// what it did, each line with its own Undo. Consent first (ADR-0006); the
// work and the safety rules live in the otto-agent function.
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text as RNText, TextInput, View } from 'react-native';
import { Button, Sheet, Text, useToast } from '@/shared/ui';
import { colors, radii, space, type } from '@/shared/theme/tokens';
import { ensureAiConsent } from '@/shared/aiConsent';
import { isOnline } from '@/shared/online';
import { haptics } from '@/shared/haptics';
import { track } from '@/shared/track';
import { askPlanAgent, newRequestId, undoAgentAction, type AgentDid, type AgentTurn } from '../agent.queries';

export function PlanAgentSheet({ visible, onClose, onChanged }: { visible: boolean; onClose: () => void; onChanged: () => void }) {
  const { show } = useToast();
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [did, setDid] = useState<AgentDid[]>([]);
  const [undone, setUndone] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const ask = text.trim();
    if (!ask || busy) return;
    if (!isOnline()) return setError('Otto needs a connection for that.');
    if (!(await ensureAiConsent())) return;
    setBusy(true);
    setError(null);
    const next: AgentTurn[] = [...turns, { role: 'user', content: ask.slice(0, 600) }];
    try {
      const res = await askPlanAgent(next, newRequestId());
      setTurns([...next, { role: 'assistant', content: res.message.slice(0, 600) || 'Done.' }]);
      setReply(res.message);
      setDid((d) => [...res.did, ...d]);
      setText('');
      if (res.did.length) {
        haptics.notify('success');
        track('week_planned_by_otto', { items: res.did.length, new_recipes: 0, constraints: ask.split(/\s+/).length > 4 ? 1 : 0 });
        onChanged();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Otto couldn't finish that.");
    } finally {
      setBusy(false);
    }
  };

  const undo = async (row: AgentDid) => {
    try {
      await undoAgentAction(row.id);
      haptics.select();
      setUndone((u) => new Set(u).add(row.id));
      onChanged();
    } catch (e) {
      show(e instanceof Error ? e.message : "Otto couldn't undo that.", 'error');
    }
  };

  const close = () => {
    setTurns([]);
    setReply(null);
    setDid([]);
    setUndone(new Set());
    setError(null);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Plan with Otto">
      <View style={{ gap: space[3], paddingBottom: space[2] }}>
        <Text role="caption">Say what you want this week. Otto plans from its own recipes and leaves out your allergies and foods you skip. Always check labels.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nothing over 30 minutes, tacos on Friday"
          placeholderTextColor={colors.inkSoft}
          multiline
          maxLength={600}
          accessibilityLabel="What should Otto plan"
          style={{ backgroundColor: colors.creamDeep, borderRadius: radii.card, padding: space[3], minHeight: 72, fontSize: 16, color: colors.ink, textAlignVertical: 'top' }}
        />
        {busy ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
            <ActivityIndicator color={colors.terracotta} />
            <Text role="body">Otto is planning…</Text>
          </View>
        ) : (
          <Button title={turns.length ? 'Ask again' : 'Plan it'} variant="primary" onPress={() => void ask()} disabled={!text.trim()} />
        )}
        {error != null && (
          <View accessibilityRole="alert">
            <Text role="computed">{error}</Text>
          </View>
        )}
        {reply != null && <Text role="body">{reply}</Text>}
        {did.length > 0 && (
          <View style={{ gap: space[2] }}>
            <Text role="meta">OTTO DID</Text>
            {did.map((row) => {
              const gone = undone.has(row.id);
              return (
                <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 44 }}>
                  <View style={{ flex: 1 }}>
                    <RNText style={[type.body, { color: gone ? colors.inkSoft : colors.ink, textDecorationLine: gone ? 'line-through' : 'none' }]}>{row.summary}</RNText>
                  </View>
                  {row.undoable && !gone && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Undo: ${row.summary}`}
                      onPress={() => void undo(row)}
                      hitSlop={8}
                      style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}
                    >
                      <RNText style={[type.body, { fontWeight: '600', color: colors.terracotta }]}>Undo</RNText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Sheet>
  );
}
