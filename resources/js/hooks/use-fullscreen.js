import {
    enterAppFullscreen,
    exitAppFullscreen,
    isAppFullscreen,
    isFullscreenSupported,
    subscribeAppFullscreen,
    toggleAppFullscreen,
} from '@/lib/fullscreen';
import { useCallback, useEffect, useState } from 'react';

/**
 * Estado de pantalla completa sincronizado con el documento.
 */
export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        setSupported(isFullscreenSupported());
        setIsFullscreen(isAppFullscreen());
        return subscribeAppFullscreen(setIsFullscreen);
    }, []);

    const enter = useCallback(async () => {
        await enterAppFullscreen();
        setIsFullscreen(isAppFullscreen());
    }, []);

    const exit = useCallback(async () => {
        await exitAppFullscreen();
        setIsFullscreen(isAppFullscreen());
    }, []);

    const toggle = useCallback(async () => {
        await toggleAppFullscreen();
        setIsFullscreen(isAppFullscreen());
    }, []);

    return {
        isFullscreen,
        supported,
        enter,
        exit,
        toggle,
    };
}
