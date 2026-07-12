export default function SalesLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-96 bg-gray-100 rounded-xl" />
    </div>
  );
}
