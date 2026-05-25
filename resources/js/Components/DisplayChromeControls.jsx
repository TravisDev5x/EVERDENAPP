import AppearanceToggle from '@/Components/AppearanceToggle';
import DeviceViewToggle from '@/Components/DeviceViewToggle';
import FullscreenToggle from '@/Components/FullscreenToggle';
import { cn } from '@/lib/utils';

/**
 * Controles globales de chrome: vista móvil, pantalla completa y tema visual.
 */
export default function DisplayChromeControls({
    className = '',
    forceDeviceView = false,
    onToggleDeviceView,
    showDeviceViewToggle = true,
}) {
    return (
        <div className={cn('inline-flex shrink-0 items-center gap-0.5', className)}>
            {showDeviceViewToggle ? (
                <DeviceViewToggle
                    forceDeviceView={forceDeviceView}
                    onToggle={onToggleDeviceView}
                />
            ) : null}
            <FullscreenToggle />
            <AppearanceToggle />
        </div>
    );
}
