import { cn } from '@/lib/utils';

function Progress({ className, value = 0, ...props }) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
            data-slot="progress"
            className={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
                className,
            )}
            {...props}
        >
            <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

export { Progress };
