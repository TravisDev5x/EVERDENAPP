import { useFullscreen } from '@/hooks/use-fullscreen';
import { displayChromeButtonClass } from '@/lib/display-chrome';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Activa pantalla completa del documento (junto al selector de tema).
 * No se renderiza si el navegador no soporta la API.
 */
export default function FullscreenToggle({ className = '' }) {
    const { isFullscreen, supported, toggle } = useFullscreen();

    if (!supported) {
        return null;
    }

    const label = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';

    return (
        <button
            type="button"
            onClick={() => {
                void toggle();
            }}
            title={`${label}. También puedes usar Esc para salir.`}
            aria-label={label}
            aria-pressed={isFullscreen}
            className={cn(displayChromeButtonClass, className)}
        >
            {isFullscreen ? (
                <Minimize2 className="size-[18px] shrink-0 stroke-[1.5]" aria-hidden />
            ) : (
                <Maximize2 className="size-[18px] shrink-0 stroke-[1.5]" aria-hidden />
            )}
        </button>
    );
}
