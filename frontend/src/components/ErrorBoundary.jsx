import React from 'react';

/**
 * Generic React error boundary. Catches render errors in its subtree and
 * shows a fallback UI instead of white-screening the entire app.
 *
 * Usage:
 *   <ErrorBoundary section="GlobeMap">
 *     <GlobeMap />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; in production this could feed Sentry/etc.
    console.error(
      `[ErrorBoundary] ${this.props.section || 'Component'} crashed:`,
      error.message,
      info.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#94a3b8',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.85rem',
          }}
        >
          <p style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong{this.props.section ? ` in ${this.props.section}` : ''}.
          </p>
          <p style={{ marginBottom: '1rem', fontSize: '0.75rem' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#22d3ee',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
