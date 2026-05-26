import { useEffect, useRef, useState } from 'react';

const ZONE_HEIGHT = 50;
const LEAVE_DELAY_MS = 180;

/** Debe coincidir con MobileBottomBar (placement top): top-11, pt-1, h-[4.25rem], px-4, max-w-lg */
const TOP_BAR_LAYOUT = {
    topRem: 2.75,
    paddingTopRem: 0.25,
    navHeightRem: 4.25,
    horizontalPaddingRem: 1,
    maxWidthRem: 32,
    zoneMarginPx: 10,
};

function remToPx(rem) {
    const root =
        typeof document !== 'undefined'
            ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
            : 16;
    return rem * root;
}

function isInTopBarHotZone(clientX, clientY) {
    const topPx = remToPx(TOP_BAR_LAYOUT.topRem);
    const padTopPx = remToPx(TOP_BAR_LAYOUT.paddingTopRem);
    const navHeightPx = remToPx(TOP_BAR_LAYOUT.navHeightRem);
    const horizontalPadPx = remToPx(TOP_BAR_LAYOUT.horizontalPaddingRem);
    const maxBarWidthPx = remToPx(TOP_BAR_LAYOUT.maxWidthRem);
    const margin = TOP_BAR_LAYOUT.zoneMarginPx;

    const barWidth = Math.min(
        maxBarWidthPx,
        window.innerWidth - horizontalPadPx * 2,
    );
    const left = (window.innerWidth - barWidth) / 2;
    const right = left + barWidth;

    const zoneTop = topPx - margin;
    const zoneBottom = topPx + padTopPx + navHeightPx + margin;

    return (
        clientY >= zoneTop &&
        clientY <= zoneBottom &&
        clientX >= left - margin &&
        clientX <= right + margin
    );
}

function isInBottomBarHotZone(clientX, clientY) {
    const horizontalPadPx = remToPx(TOP_BAR_LAYOUT.horizontalPaddingRem);
    const maxBarWidthPx = remToPx(TOP_BAR_LAYOUT.maxWidthRem);
    const navHeightPx = remToPx(TOP_BAR_LAYOUT.navHeightRem);
    const margin = TOP_BAR_LAYOUT.zoneMarginPx;

    const barWidth = Math.min(
        maxBarWidthPx,
        window.innerWidth - horizontalPadPx * 2,
    );
    const left = (window.innerWidth - barWidth) / 2;
    const right = left + barWidth;

    const fromBottom = window.innerHeight - clientY;
    const zoneDepth = ZONE_HEIGHT + navHeightPx + margin;

    return (
        fromBottom <= zoneDepth &&
        clientX >= left - margin &&
        clientX <= right + margin
    );
}

/**
 * Detecta el cursor sobre la zona de la barra de navegación flotante.
 * @param {'bottom' | 'top'} edge
 */
export function useHoverNearBottom(enabled = true, edge = 'bottom') {
    const [isNear, setIsNear] = useState(false);
    const leaveTimerRef = useRef(null);

    useEffect(() => {
        if (!enabled) {
            setIsNear(false);
            return undefined;
        }

        const onMouseMove = (e) => {
            const inZone =
                edge === 'bottom'
                    ? isInBottomBarHotZone(e.clientX, e.clientY)
                    : isInTopBarHotZone(e.clientX, e.clientY);

            if (inZone) {
                if (leaveTimerRef.current) {
                    clearTimeout(leaveTimerRef.current);
                    leaveTimerRef.current = null;
                }
                setIsNear(true);
                return;
            }

            if (!leaveTimerRef.current) {
                leaveTimerRef.current = setTimeout(() => {
                    setIsNear(false);
                    leaveTimerRef.current = null;
                }, LEAVE_DELAY_MS);
            }
        };

        const onMouseLeave = () => {
            if (leaveTimerRef.current) {
                clearTimeout(leaveTimerRef.current);
            }
            leaveTimerRef.current = setTimeout(() => {
                setIsNear(false);
                leaveTimerRef.current = null;
            }, LEAVE_DELAY_MS);
        };

        document.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            if (leaveTimerRef.current) {
                clearTimeout(leaveTimerRef.current);
            }
        };
    }, [enabled, edge]);

    return isNear;
}
