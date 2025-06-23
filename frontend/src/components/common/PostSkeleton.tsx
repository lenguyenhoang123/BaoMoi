import React from 'react';

export function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4 border-b pb-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3 h-48 bg-gray-200 rounded-lg"></div>
        <div className="md:w-2/3 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}
