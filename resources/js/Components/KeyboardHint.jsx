import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

/**
 * Hint para descubrir el atajo M de la barra de navegación.
 */
export default function KeyboardHint({
    visible = true,
    label = 'Presiona M para menú',
    placement = 'bottom',
}) {
    if (!visible) {
        return null;
    }

    const isTop = placement === 'top';

    return (
        <div
            className={cn(
                'pointer-events-none fixed right-4 z-50',
                'flex items-center gap-1.5',
                'rounded-full border border-border',
                'bg-background px-2.5 py-1',
                'text-[10px] font-medium text-muted-foreground',
                'shadow-md',
                'animate-in fade-in duration-300',
                isTop
                    ? 'top-24 slide-in-from-top-2'
                    : 'bottom-4 slide-in-from-bottom-2',
            )}
            aria-hidden="true"
        >
            <Keyboard className="h-3 w-3" />
            <span>{label}</span>
            <kbd className="ml-1 rounded border border-border bg-muted px-1 font-mono text-[9px]">
                M
            </kbd>
        </div>
    );
}
