import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'everden-force-device-view';
const CHANGE_EVENT = 'everden-force-device-view-change';

function readForceDeviceView() {
    if (typeof window === 'undefined') {
        return false;
    }

    return localStorage.getItem(STORAGE_KEY) === '1';
}

const subscribers = new Set();

function publishDeviceViewChange() {
    subscribers.forEach((sync) => sync());
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }
}

export function useDeviceView() {
    const [forceDeviceView, setForceDeviceView] = useState(readForceDeviceView);

    useEffect(() => {
        const sync = () => setForceDeviceView(readForceDeviceView());
        subscribers.add(sync);

        const onExternalChange = () => sync();
        window.addEventListener(CHANGE_EVENT, onExternalChange);
        window.addEventListener('storage', onExternalChange);

        return () => {
            subscribers.delete(sync);
            window.removeEventListener(CHANGE_EVENT, onExternalChange);
            window.removeEventListener('storage', onExternalChange);
        };
    }, []);

    const toggle = useCallback(() => {
        setForceDeviceView((current) => {
            const next = !current;
            localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            publishDeviceViewChange();
            return next;
        });
    }, []);

    return { forceDeviceView, toggle };
}
