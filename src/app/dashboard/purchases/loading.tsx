export default function PurchasesLoading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand animate-pulse" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    </div>
  );
}
