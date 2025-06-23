'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Cập nhật state để hiển thị giao diện dự phòng
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ghi log lỗi ra console
    console.error('ErrorBoundary bắt được lỗi:', error, errorInfo);
    
    // Gọi hàm callback onError nếu được cung cấp
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Hiển thị giao diện dự phòng tùy chỉnh
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <h2 className="font-bold text-lg mb-2">Đã xảy ra lỗi</h2>
          <p className="mb-2">{this.state.error?.message || 'Có lỗi xảy ra khi tải nội dung.'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              // Thêm logic thử lại tại đây nếu cần
            }}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-800 text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
