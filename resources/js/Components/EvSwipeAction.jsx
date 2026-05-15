import { useSwipe } from '@/hooks/use-swipe';
import { Trash2 } from 'lucide-react';

/**
 * EvSwipeAction - Wrapper "Swipe to Action" para listas POS.
 *
 * - Renderiza el contenido encima de una "pista" coloreada (rojo destructivo
 *   por defecto) con un icono que se revela conforme el usuario desliza.
 * - El padre conserva 100% su DOM y handlers: solo envuelve cada item.
 * - Mantiene compatibilidad con raton: el swipe tambien funciona con drag
 *   primario, pero los botones internos (ej. Quitar) siguen siendo el camino
 *   accesible para teclado y mouse.
 * - Respeta scroll vertical: si el primer movimiento es vertical, el gesto
 *   no se captura y el contenedor con touch-scroll-y sigue desplazandose.
 *
 * Props:
 *   - children: contenido del item.
 *   - onSwipeLeft / onSwipeRight: callbacks; si no se pasan, esa direccion
 *     queda inactiva (no se permite mover hacia ese lado).
 *   - leftLabel / rightLabel: leyenda revelada (default "Eliminar").
 *   - leftIcon / rightIcon: icono lucide (default Trash2).
 *   - leftTone / rightTone: 'destructive' | 'confirm' | 'warning'.
 *   - threshold: px que se deben deslizar para disparar la accion.
 */
const TONE_CLASSES = {
    destructive: 'bg-red-600 text-white',
    confirm: 'bg-primary text-primary-foreground',
    warning: 'bg-amber-500 text-amber-950',
};

export default function EvSwipeAction({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftLabel = 'Eliminar',
    rightLabel = 'Confirmar',
    LeftIcon = Trash2,
    RightIcon = Trash2,
    leftTone = 'destructive',
    rightTone = 'confirm',
    threshold = 80,
    className = '',
}) {
    const { offset, progress, direction, active, handlers } = useSwipe({
        onSwipeLeft,
        onSwipeRight,
        threshold,
    });

    const showLeft = direction === 'left';
    const showRight = direction === 'right';
    const leftClasses = TONE_CLASSES[leftTone] ?? TONE_CLASSES.destructive;
    const rightClasses = TONE_CLASSES[rightTone] ?? TONE_CLASSES.confirm;

    return (
        <div className={`swipe-track rounded-lg ${className}`}>
            {/* Pista revelada al deslizar a la izquierda (accion en el lado derecho de la pista) */}
            {onSwipeLeft ? (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 rounded-lg px-5 text-sm font-semibold uppercase tracking-widest transition-opacity ${leftClasses}`}
                    style={{ opacity: showLeft ? Math.max(0.4, progress) : 0 }}
                >
                    <LeftIcon className="size-5" />
                    <span>{leftLabel}</span>
                </div>
            ) : null}

            {/* Pista revelada al deslizar a la derecha */}
            {onSwipeRight ? (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 rounded-lg px-5 text-sm font-semibold uppercase tracking-widest transition-opacity ${rightClasses}`}
                    style={{ opacity: showRight ? Math.max(0.4, progress) : 0 }}
                >
                    <RightIcon className="size-5" />
                    <span>{rightLabel}</span>
                </div>
            ) : null}

            <div
                {...handlers}
                className="swipe-deck relative bg-inherit"
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: active ? 'none' : 'transform 200ms ease-out',
                }}
            >
                {children}
            </div>
        </div>
    );
}
