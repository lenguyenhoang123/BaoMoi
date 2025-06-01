'use client';

export default function BreakingNews() {
  const news = [
    'Tin mới nhất về tình hình thời tiết hôm nay',
    'Giá vàng hôm nay tăng mạnh',
    'Kết quả bóng đá đêm qua'
  ];

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className="bg-red-600 text-white px-3 py-1 font-bold text-sm mr-4 whitespace-nowrap">TIN NÓNG:</div>
          <div className="overflow-hidden">
            <div className="whitespace-nowrap animate-marquee">
              {news.map((item, index) => (
                <span key={index} className="inline-block mr-8">
                  <a href="#" className="text-red-600 hover:underline font-medium">{item}</a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
