'use client';

export default function NewsList() {
  const news = [
    {
      title: 'Tin tức mới nhất 1',
      description: 'Mô tả ngắn gọn tin tức mới nhất 1...',
      image: '/images/news3.jpg',
      category: 'Thời sự',
      date: '22/05/2025'
    },
    // Thêm nhiều item tin tức khác
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-red-700">TIN TỨC MỚI NHẤT</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <span className="bg-red-700 text-white px-2 py-1 rounded text-sm mb-2">{item.category}</span>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 line-clamp-2">{item.description}</p>
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>{item.date}</span>
                <span>Đọc thêm <i className="fas fa-arrow-right"></i></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
