import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { colors, space } from '../theme/tokens';
import {
  Button,
  OttoArt,
  PawMark,
  Ring,
  SegmentBar,
  Sheet,
  Text,
  ToastHost,
  useToast,
} from './index';

// All 8 primitives with sample props, for L3 screenshots. NOT a route — the
// integration builder mounts it.
export function Gallery() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [segment, setSegment] = useState('per-serving');
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5] }}>
        <Text role="display">Otto UI gallery</Text>

        <Text role="title">Text</Text>
        <Text role="display">Display — Lora</Text>
        <Text role="title">Title — Lora</Text>
        <Text role="body">Body — authored ink</Text>
        <Text role="caption">Caption — secondary ink</Text>
        <Text role="computed">Computed — terracotta, 420 kcal</Text>

        <Text role="title">Button</Text>
        <Button title="Primary" variant="primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Destructive" variant="destructive" onPress={() => {}} />
        <Button title="Large" variant="primary" size="lg" onPress={() => {}} />
        <Button title="Disabled" variant="primary" disabled onPress={() => {}} />
        <Button title="Loading" variant="primary" loading onPress={() => {}} />

        <Text role="title">Ring</Text>
        <View style={{ flexDirection: 'row', gap: space[5] }}>
          <Ring value={420} max={2000} label="kcal" />
          <Ring value={null} max={2000} label="no data" />
          <Ring value={0} max={2000} label="zero" />
        </View>

        <Text role="title">SegmentBar</Text>
        <SegmentBar
          segments={[
            { label: 'Per serving', value: 'per-serving' },
            { label: 'Whole dish', value: 'whole-dish' },
          ]}
          selected={segment}
          onSelect={setSegment}
        />

        <Text role="title">PawMark</Text>
        <View style={{ flexDirection: 'row', gap: space[4], alignItems: 'center' }}>
          <PawMark saved={saved} onToggle={() => setSaved((s) => !s)} />
          <PawMark saved size={44} onToggle={() => {}} />
        </View>

        <Text role="title">OttoArt</Text>
        <View style={{ flexDirection: 'row', gap: space[3], flexWrap: 'wrap' }}>
          <OttoArt name="happy" />
          <OttoArt name="scene-cooking" size={72} />
          <OttoArt name="action-chop" size={72} />
        </View>

        <Text role="title">Toast</Text>
        <Button title="Show info toast" variant="secondary" onPress={() => toast.show('Saved to your cookbook', 'info')} />
        <Button title="Show success toast" variant="secondary" onPress={() => toast.show('Recipe imported', 'success')} />
        <Button title="Show error toast" variant="secondary" onPress={() => toast.show('We dropped the pan — try again', 'error')} />

        <Text role="title">Sheet</Text>
        <Button title="Open sheet" variant="primary" onPress={() => setSheetOpen(true)} />
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Sample sheet">
        <Text role="body">Bottom sheet content — plain Modal, web-safe.</Text>
        <View style={{ marginTop: space[4] }}>
          <Button title="Close" variant="secondary" onPress={() => setSheetOpen(false)} />
        </View>
      </Sheet>

      <ToastHost />
    </View>
  );
}
