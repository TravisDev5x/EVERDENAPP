import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'everden-force-device-view';

export function useDeviceView() {
    const [forceDeviceView, setForceDeviceView] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return localStorage.getItem(STORAGE_KEY) === '1';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, forceDeviceView ? '1' : '0');
    }, [forceDeviceView]);

    const toggle = useCallback(() => {
        setForceDeviceView((v) => !v);
    }, []);

    return { forceDeviceView, toggle };
}
