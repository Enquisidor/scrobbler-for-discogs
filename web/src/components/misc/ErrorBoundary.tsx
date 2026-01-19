import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-8">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-400 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
                Refresh Page
            </button>
            {this.state.error && (
                <pre className="mt-8 p-4 bg-gray-800 rounded-lg text-sm text-red-300 overflow-auto w-full max-w-2xl">
                    <code>{this.state.error.toString()}</code>
                    <br />
                    <code>{this.state.error.stack}</code>
                </pre>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
