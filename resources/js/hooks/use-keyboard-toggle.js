import { useEffect, useState } from 'react';

export function useKeyboardToggle(key = 'm', enabled = true, initial = false) {
    const [isToggled, setIsToggled] = useState(initial);

    useEffect(() => {
        if (!enabled) {
            setIsToggled(initial);
            return undefined;
        }

        const onKeyDown = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                e.target?.isContentEditable ||
                e.target?.closest?.('[role="combobox"]')
            ) {
                return;
            }

            if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
                return;
            }

            if (e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault();
                setIsToggled((v) => !v);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [key, enabled]);

    return [isToggled, setIsToggled];
}
