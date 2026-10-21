import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-800/60 border border-white/[0.04] ${rounded} ${className}`}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-5 rounded-2xl bg-[#0B101E]/75 border border-white/[0.07] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-2 border-b border-white/[0.06]">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 border-b border-white/[0.03]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
