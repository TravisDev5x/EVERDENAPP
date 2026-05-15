import AppearanceToggle from '@/Components/AppearanceToggle';
import FullscreenToggle from '@/Components/FullscreenToggle';
import { cn } from '@/lib/utils';

/**
 * Controles globales de chrome: pantalla completa + tema visual.
 */
export default function DisplayChromeControls({ className = '' }) {
    return (
        <div className={cn('inline-flex shrink-0 items-center gap-0.5', className)}>
            <FullscreenToggle />
            <AppearanceToggle />
        </div>
    );
}
