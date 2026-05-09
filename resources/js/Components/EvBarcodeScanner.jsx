import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';

const DEFAULT_DEBOUNCE_MS = 50;
const DEFAULT_DEDUPE_WINDOW_MS = 600;
const MIN_LENGTH = 3;

/**
 * Captura de codigos de barras / SKU para POS Everden.
 * - Buffer interno para no perder caracteres por re-render.
 * - Confirma por Enter o por inactividad (>50ms entre teclas).
 * - Descarta el mismo codigo si llega dentro de la ventana de deduplicacion.
 * - Reporta lecturas invalidas para que el POS muestre alerta operativa.
 */
const EvBarcodeScanner = forwardRef(function EvBarcodeScanner(
    {
        onScan,
        onDuplicate,
        onInvalid,
        disabled = false,
        debounceMs = DEFAULT_DEBOUNCE_MS,
        dedupeWindowMs = DEFAULT_DEDUPE_WINDOW_MS,
        autoFocus = true,
        label = 'Codigo / SKU (lector laser o QR con texto)',
        placeholder = 'Enfoca aqui y escanea',
        helpText = 'El lector enviara Enter al final. Repetir el mismo codigo suma cantidad.',
    },
    ref,
) {
    const inputRef = useRef(null);
    const bufferRef = useRef('');
    const lastKeyTsRef = useRef(0);
    const idleTimerRef = useRef(null);
    const lastScanRef = useRef({ code: '', at: 0 });
    const [value, setValue] = useState('');

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => {
            bufferRef.current = '';
            setValue('');
        },
    }));

    useEffect(() => {
        if (autoFocus) {
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [autoFocus]);

    const commit = (raw) => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }

        const code = (raw ?? '').trim();
        bufferRef.current = '';
        setValue('');

        if (!code) {
            return;
        }

        if (code.length < MIN_LENGTH) {
            onInvalid?.({ reason: 'too_short', code });
            inputRef.current?.focus();
            return;
        }

        const now = Date.now();
        if (
            code === lastScanRef.current.code &&
            now - lastScanRef.current.at < dedupeWindowMs
        ) {
            onDuplicate?.(code);
            inputRef.current?.focus();
            return;
        }

        lastScanRef.current = { code, at: now };
        onScan?.(code, { source: 'scanner', at: now });
        inputRef.current?.focus();
    };

    const handleChange = (event) => {
        const next = event.target.value;
        bufferRef.current = next;
        setValue(next);
        lastKeyTsRef.current = Date.now();

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (Date.now() - lastKeyTsRef.current >= debounceMs && bufferRef.current.length >= MIN_LENGTH) {
                // Confirmacion por inactividad: util si la pistola no envia Enter.
                if (bufferRef.current.length >= 6) {
                    commit(bufferRef.current);
                }
            }
        }, Math.max(debounceMs, 30));
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commit(bufferRef.current);
        }
    };

    return (
        <div>
            <InputLabel htmlFor="ev-barcode-scanner" value={label} />
            <TextInput
                id="ev-barcode-scanner"
                ref={inputRef}
                name="scan_code"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="mt-1 block w-full font-mono text-lg tracking-wide"
                placeholder={placeholder}
                inputMode="text"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
            />
            {helpText ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{helpText}</p>
            ) : null}
        </div>
    );
});

export default EvBarcodeScanner;
