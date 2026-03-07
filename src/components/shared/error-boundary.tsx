'use client';

import { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-900/20">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">Something went wrong</h2>
          <p className="mt-1 max-w-md text-center text-sm text-neutral-400">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button
            onClick={this.handleReset}
            className="mt-6 bg-neutral-800 hover:bg-neutral-700 text-white"
            size="sm"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
