import { useCallback, useRef, useState } from 'react';

const DEFAULT_OPTIONS = {
    threshold: 80,
    maxOffset: 160,
    axisLockTolerance: 8,
};

/**
 * useSwipe - Hook de gesto horizontal (Pointer Events) Touch-First Everden.
 *
 * Caracteristicas clave:
 *   - Solo dispara onSwipeLeft / onSwipeRight si superan `threshold`.
 *   - "Axis lock": si el primer movimiento es vertical no captura el gesto,
 *     dejando libre el scroll del contenedor (touch-action: pan-y).
 *   - Cancela en mousewheel o cuando el navegador roba el pointer (lostpointer).
 *   - Compatible con mouse, touch y stylus via Pointer Events.
 *
 * Devuelve:
 *   - `offset`: desplazamiento horizontal actual (px) para aplicar al transform.
 *   - `progress`: 0..1 segun threshold, util para animar fondo/icono.
 *   - `direction`: 'left' | 'right' | null (mientras hay gesto activo).
 *   - `active`: bool, mientras el dedo/raton esta presionado.
 *   - `handlers`: spread sobre el elemento que recibe el gesto.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold, maxOffset, axisLockTolerance } = {}) {
    const opts = {
        threshold: threshold ?? DEFAULT_OPTIONS.threshold,
        maxOffset: maxOffset ?? DEFAULT_OPTIONS.maxOffset,
        axisLockTolerance: axisLockTolerance ?? DEFAULT_OPTIONS.axisLockTolerance,
    };

    const stateRef = useRef({
        startX: 0,
        startY: 0,
        startTime: 0,
        axisLocked: null,
        pointerId: null,
        active: false,
    });

    const [offset, setOffset] = useState(0);
    const [active, setActive] = useState(false);
    const [direction, setDirection] = useState(null);

    const reset = useCallback(() => {
        stateRef.current.active = false;
        stateRef.current.axisLocked = null;
        stateRef.current.pointerId = null;
        setActive(false);
        setOffset(0);
        setDirection(null);
    }, []);

    const onPointerDown = useCallback((event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        stateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now(),
            axisLocked: null,
            pointerId: event.pointerId,
            active: true,
        };
        setActive(true);
    }, []);

    const onPointerMove = useCallback(
        (event) => {
            const state = stateRef.current;
            if (!state.active || event.pointerId !== state.pointerId) return;

            const dx = event.clientX - state.startX;
            const dy = event.clientY - state.startY;

            if (!state.axisLocked) {
                if (Math.abs(dx) < opts.axisLockTolerance && Math.abs(dy) < opts.axisLockTolerance) {
                    return;
                }
                state.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';

                if (state.axisLocked === 'x') {
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                } else {
                    reset();
                    return;
                }
            }

            if (state.axisLocked !== 'x') return;

            let next = dx;
            if (!onSwipeRight && next > 0) next = 0;
            if (!onSwipeLeft && next < 0) next = 0;
            next = Math.max(-opts.maxOffset, Math.min(opts.maxOffset, next));
            setOffset(next);
            setDirection(next === 0 ? null : next > 0 ? 'right' : 'left');
        },
        [onSwipeLeft, onSwipeRight, opts.axisLockTolerance, opts.maxOffset, reset],
    );

    const onPointerUp = useCallback(
        (event) => {
            const state = stateRef.current;
            if (!state.active) return;

            if (state.axisLocked === 'x') {
                const dx = event.clientX - state.startX;
                if (dx <= -opts.threshold && onSwipeLeft) {
                    onSwipeLeft();
                } else if (dx >= opts.threshold && onSwipeRight) {
                    onSwipeRight();
                }
            }

            reset();
        },
        [onSwipeLeft, onSwipeRight, opts.threshold, reset],
    );

    const handlers = {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: reset,
        onLostPointerCapture: reset,
    };

    const progress = Math.min(1, Math.abs(offset) / opts.threshold);

    return { offset, progress, direction, active, handlers };
}
