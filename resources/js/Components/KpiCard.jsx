import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

const variantClasses = {
    default: 'border-border bg-card',
    danger: 'border-destructive/50 bg-card',
    warning: 'border-amber-500/50 bg-card',
    success: 'border-emerald-500/50 bg-card',
};

/**
 * @param {{
 *   title: string,
 *   value: string | number,
 *   icon?: import('lucide-react').LucideIcon,
 *   variant?: 'default' | 'danger' | 'warning' | 'success',
 *   hint?: string,
 *   trend?: string,
 * }} props
 */
export default function KpiCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
    hint,
    trend,
}) {
    return (
        <Card
            className={cn(
                variantClasses[variant] ?? variantClasses.default,
                'shadow-sm transition-all',
            )}
        >
            <CardContent className="p-4 sm:p-5">
                <div className="flex h-full min-h-[5rem] items-start justify-between gap-2">
                    <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                            {title}
                        </p>
                        <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{value}</div>
                        {(hint || trend) && (
                            <div className="space-y-0.5">
                                {hint ? (
                                    <p className="line-clamp-2 text-[10px] text-muted-foreground">{hint}</p>
                                ) : null}
                                {trend ? (
                                    <p className="text-[10px] text-muted-foreground">{trend}</p>
                                ) : null}
                            </div>
                        )}
                    </div>
                    {Icon ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground sm:h-11 sm:w-11">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
