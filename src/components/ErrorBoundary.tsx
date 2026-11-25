import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7FC] text-[#2E1639] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E4D5EC] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#F3ECF7] text-[#5B236E] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[#2E1639] mb-2">
              Algo não saiu como esperado
            </h1>
            <p className="text-sm text-[#634B6F] leading-relaxed mb-6">
              Não foi possível concluir a operação no momento. Recarregue a página para tentar novamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B236E] text-white text-sm font-medium hover:bg-[#4A1A5B] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
