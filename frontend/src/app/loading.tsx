export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      <span className="ml-4 text-lg">Đang tải...</span>
    </div>
  );
}
