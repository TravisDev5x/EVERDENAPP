import { Skeleton } from '@/Components/ui/skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-80 max-w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
        </div>
    );
}
