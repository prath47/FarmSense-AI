interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: Props) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <Skeleton className="w-9 h-9 rounded-lg" />
      <Skeleton className="w-20 h-3 rounded" />
      <Skeleton className="w-28 h-6 rounded" />
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <tr className="border-b border-gray-50">
      {[60, 48, 72, 120, 64, 80, 20].map((w, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton className={`h-3 rounded`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-48 px-4">
      {[60, 90, 50, 80, 40, 70, 55].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col gap-1 items-center">
          <Skeleton className="w-full rounded-t" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex justify-start mb-3 gap-2">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="space-y-2 max-w-[60%]">
        <Skeleton className="h-4 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-48 rounded-2xl" />
        <Skeleton className="h-4 w-56 rounded-2xl" />
      </div>
    </div>
  );
}
