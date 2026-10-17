"use client";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="w-full lg:max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search videos..."
        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-5 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-500"
      />
    </div>
  );
}
