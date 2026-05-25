import { useEffect } from 'react';

export function useSwipeToClose(
    ref,
    onClose,
    isOpen,
    { side = 'left', threshold = 72, velocityThreshold = 0.35 } = {},
) {
    useEffect(() => {
        if (!isOpen || !ref?.current) {
            return;
        }

        const el = ref.current;
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        const onTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        };

        const onTouchEnd = (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const elapsed = Date.now() - startTime;

            const deltaX = endX - startX;
            const deltaY = Math.abs(endY - startY);

            if (deltaY > Math.abs(deltaX)) {
                return;
            }

            const velocity = Math.abs(deltaX) / elapsed;
            const isLeftSwipe = deltaX < -threshold;
            const isFastSwipe = velocity > velocityThreshold && deltaX < -20;

            if (side === 'left' && (isLeftSwipe || isFastSwipe)) {
                onClose();
            }
        };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend', onTouchEnd);
        };
    }, [isOpen, onClose, ref, side, threshold, velocityThreshold]);
}
