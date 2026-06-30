"use client";

const skeletonRows = ["w-3/4", "w-full", "w-5/6", "w-2/3"];

export function QuizLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-56 rounded-md bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded-md bg-slate-100" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-3">
          {skeletonRows.map((widthClass) => (
            <div
              key={widthClass}
              className={`h-4 rounded-md bg-slate-200 ${widthClass}`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-16 rounded-md border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="mascot-blink h-2 w-2 rounded-full bg-brand-500" />
        Menyiapkan soal untuk Anda...
      </div>
    </div>
  );
}
