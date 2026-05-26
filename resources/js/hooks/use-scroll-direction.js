import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 10;
const HIDE_DELAY_MS = 120;

export function useScrollDirection() {
    const [isHidden, setIsHidden] = useState(false);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);
    const hideTimerRef = useRef(null);

    useEffect(() => {
        const getScrollTarget = () =>
            document.getElementById('main-content') ?? window;

        const getScrollY = (target) =>
            target === window ? window.scrollY : target.scrollTop;

        const onScroll = (e) => {
            if (ticking.current) return;

            ticking.current = true;

            window.requestAnimationFrame(() => {
                const target =
                    e?.currentTarget ?? e?.target ?? getScrollTarget();
                const currentY = getScrollY(target);
                const diff = currentY - lastScrollY.current;

                if (Math.abs(diff) < THRESHOLD) {
                    ticking.current = false;
                    return;
                }

                if (diff > 0 && currentY > 60) {
                    if (!hideTimerRef.current) {
                        hideTimerRef.current = setTimeout(() => {
                            setIsHidden(true);
                            hideTimerRef.current = null;
                        }, HIDE_DELAY_MS);
                    }
                } else {
                    if (hideTimerRef.current) {
                        clearTimeout(hideTimerRef.current);
                        hideTimerRef.current = null;
                    }
                    setIsHidden(false);
                }

                lastScrollY.current = currentY;
                ticking.current = false;
            });

            ticking.current = true;
        };

        const mainContent = document.getElementById('main-content');

        window.addEventListener('scroll', onScroll, { passive: true });
        mainContent?.addEventListener('scroll', onScroll, { passive: true });

        lastScrollY.current = mainContent
            ? mainContent.scrollTop
            : window.scrollY;

        return () => {
            window.removeEventListener('scroll', onScroll);
            mainContent?.removeEventListener('scroll', onScroll);
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setIsHidden(false);
        lastScrollY.current = 0;
    }, []);

    return { isHidden };
}
