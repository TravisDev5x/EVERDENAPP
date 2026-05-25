import { cn } from '@/lib/utils';

function ScrollArea({ className, children, ...props }) {
    return (
        <div
            data-slot="scroll-area"
            className={cn('overflow-y-auto overflow-x-hidden', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export { ScrollArea };
