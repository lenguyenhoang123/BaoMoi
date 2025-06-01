export default function Banner() {
  return (
    <div className="w-full md:w-2/5">
      <div className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-medium">Quảng cáo</span>
        </div>
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
          Quảng cáo
        </div>
      </div>
    </div>
  );
}
