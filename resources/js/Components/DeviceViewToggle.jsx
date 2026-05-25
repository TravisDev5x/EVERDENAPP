import { displayChromeButtonClass } from '@/lib/display-chrome';
import { cn } from '@/lib/utils';
import { Smartphone } from 'lucide-react';

export default function DeviceViewToggle({
    forceDeviceView,
    onToggle,
    className = '',
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            title={forceDeviceView ? 'Salir de vista móvil' : 'Vista tablet/móvil'}
            aria-label={
                forceDeviceView
                    ? 'Salir de vista tablet y móvil'
                    : 'Activar vista tablet y móvil'
            }
            aria-pressed={forceDeviceView}
            className={cn(
                displayChromeButtonClass,
                forceDeviceView &&
                    'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                className,
            )}
        >
            <Smartphone className="size-[18px] shrink-0 stroke-[1.5]" aria-hidden />
        </button>
    );
}
