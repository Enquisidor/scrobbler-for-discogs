import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@libs';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    // In React Native, we reset the error state to re-render children
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.description}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          {this.state.error && (
            <ScrollView style={styles.errorContainer}>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.error.stack && (
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[900],
    padding: spacing[8],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  errorContainer: {
    marginTop: spacing[8],
    padding: spacing[4],
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    maxHeight: 200,
    width: '100%',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontFamily: 'monospace',
    marginTop: spacing[2],
  },
});

export default ErrorBoundary;
