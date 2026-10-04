import React from 'react';
import { View } from 'react-native';
import { colors, space } from '../theme/tokens';
import { Text } from './Text';
import { Button } from './Button';

// Top-level error boundary (contract: ui-components.md §6). A render failure
// anywhere shows a recoverable state instead of a white screen. React error
// boundaries must be class components. Adopts <OttoError> once P1 lands.
interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Uncaught render error', error.message);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.cream,
            alignItems: 'center',
            justifyContent: 'center',
            padding: space[6],
            gap: space[4],
          }}
        >
          <Text role="display">We dropped the pan.</Text>
          <Text role="body">Something went wrong on our side. Give it another go.</Text>
          <Button title="Try again" variant="primary" size="lg" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
