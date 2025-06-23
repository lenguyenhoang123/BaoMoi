import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

interface CategoriesListProps {
  categories?: Category[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  if (!categories || categories.length === 0) {
    return <div className="text-sm text-gray-500">Không có danh mục nào.</div>;
  }

  return (
    <ul className="space-y-2">
      {categories.map((category) => (
        <li key={category.id}>
          <Link 
            href={`/danh-muc/${category.slug}`}
            className="flex justify-between items-center py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-700 hover:text-blue-600">{category.name}</span>
            {category.post_count !== undefined && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {category.post_count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
