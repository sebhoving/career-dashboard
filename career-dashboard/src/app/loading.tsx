import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-4 px-4 py-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}
