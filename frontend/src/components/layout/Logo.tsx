import Link from 'next/link';

export default function Logo() {
  return (
    <div className="mb-4 md:mb-0 text-center md:text-left">
      <Link href="/" className="flex flex-col items-center md:items-start transform hover:scale-105 transition-transform duration-200">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
          BÁO MỚI
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tin tức 24h - Cập nhật liên tục</p>
      </Link>
    </div>
  );
}
