"use client";

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeCategory === category
              ? "bg-red-600 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
