import { useCallback, useEffect, useRef, useState } from 'react';

const PROTOCOLS = {
    /**
     * Trama tipica NCI/SCP (Toledo, CAS, Aclas, Torrey USB-Serial):
     *   "ST,GS,    1.234kg\r\n"  -> estable
     *   "US,GS,    1.232kg\r\n"  -> inestable
     *   "OL"                     -> sobre limite
     */
    nci: {
        unitDefault: 'kg',
        parse: (line) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            if (/^OL/i.test(trimmed)) return { error: 'over_limit' };

            const match = trimmed.match(/^(ST|US),(?:GS|NT),\s*([+-]?\d+(?:\.\d+)?)(?:\s*)([a-zA-Z]+)?/);
            if (!match) return null;

            const stable = match[1].toUpperCase() === 'ST';
            const value = parseFloat(match[2]);
            const unit = (match[3] ?? 'kg').toLowerCase();

            if (Number.isNaN(value)) return null;

            const weightGrams = unit === 'g' ? Math.round(value) : Math.round(value * 1000);
            return { stable, weightGrams, unit };
        },
    },

    /**
     * Linea simple numerica (firmware generico): "1.234" o "1.234 kg".
     * Se reporta como estable porque no hay flag; conviene exigir varias lecturas iguales en UI.
     */
    raw_kg: {
        unitDefault: 'kg',
        parse: (line) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            const match = trimmed.match(/([+-]?\d+(?:\.\d+)?)\s*(kg|g)?/i);
            if (!match) return null;

            const value = parseFloat(match[1]);
            const unit = (match[2] ?? 'kg').toLowerCase();
            if (Number.isNaN(value)) return null;

            const weightGrams = unit === 'g' ? Math.round(value) : Math.round(value * 1000);
            return { stable: true, weightGrams, unit };
        },
    },
};

const DEFAULT_OPTIONS = {
    protocol: 'nci',
    baudRate: 9600,
    stableSamples: 3,
};

/**
 * Hook Web Serial para basculas Everden.
 * Estados:
 *   unsupported -> el navegador no expone navigator.serial.
 *   idle        -> sin sesion abierta.
 *   connecting  -> abriendo puerto.
 *   reading     -> sesion activa.
 *   error       -> fallo en lectura/escritura.
 */
export function useSerialScale(options = {}) {
    const { protocol, baudRate, stableSamples } = { ...DEFAULT_OPTIONS, ...options };
    const supported = typeof navigator !== 'undefined' && 'serial' in navigator;

    const portRef = useRef(null);
    const readerRef = useRef(null);
    const cancelRef = useRef(false);
    const stableBufferRef = useRef([]);

    const [state, setState] = useState(supported ? 'idle' : 'unsupported');
    const [error, setError] = useState(null);
    const [reading, setReading] = useState({
        weightGrams: 0,
        unit: PROTOCOLS[protocol]?.unitDefault ?? 'kg',
        stable: false,
        receivedAt: null,
    });

    const parser = PROTOCOLS[protocol] ?? PROTOCOLS.nci;

    const stop = useCallback(async () => {
        cancelRef.current = true;
        try {
            await readerRef.current?.cancel();
        } catch (err) {
            // ignore
        }
        try {
            readerRef.current?.releaseLock();
        } catch (err) {
            // ignore
        }
        try {
            await portRef.current?.close();
        } catch (err) {
            // ignore
        }
        readerRef.current = null;
        portRef.current = null;
        stableBufferRef.current = [];
        setState(supported ? 'idle' : 'unsupported');
    }, [supported]);

    const start = useCallback(
        async (filters = []) => {
            if (!supported) {
                setError('El navegador no soporta Web Serial. Usa Chrome o Edge en HTTPS o localhost.');
                return false;
            }

            try {
                cancelRef.current = false;
                setError(null);
                setState('connecting');

                const port = filters.length > 0
                    ? await navigator.serial.requestPort({ filters })
                    : await navigator.serial.requestPort();

                await port.open({ baudRate });
                portRef.current = port;

                const decoder = new TextDecoderStream();
                port.readable.pipeTo(decoder.writable).catch(() => {
                    // se cierra al hacer stop()
                });
                const inputStream = decoder.readable;
                const reader = inputStream.getReader();
                readerRef.current = reader;
                setState('reading');

                let buffer = '';
                while (!cancelRef.current) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (!value) continue;
                    buffer += value;

                    const lines = buffer.split(/\r?\n/);
                    buffer = lines.pop() ?? '';

                    for (const rawLine of lines) {
                        const parsed = parser.parse(rawLine);
                        if (!parsed) continue;
                        if (parsed.error === 'over_limit') {
                            setError('Bascula sobre limite (OL).');
                            stableBufferRef.current = [];
                            continue;
                        }

                        const { weightGrams, stable, unit } = parsed;
                        const samples = stableBufferRef.current;
                        samples.push(weightGrams);
                        if (samples.length > stableSamples) samples.shift();

                        const stableConfirmed =
                            stable &&
                            samples.length >= stableSamples &&
                            samples.every((v) => v === weightGrams);

                        setReading({
                            weightGrams,
                            unit,
                            stable: stableConfirmed,
                            receivedAt: Date.now(),
                        });
                    }
                }

                return true;
            } catch (err) {
                const message = err?.message ?? 'Fallo al abrir el puerto serial.';
                setError(message);
                setState('error');
                return false;
            }
        },
        [baudRate, parser, stableSamples, supported],
    );

    useEffect(() => () => {
        stop();
    }, [stop]);

    const reset = useCallback(() => {
        stableBufferRef.current = [];
        setReading((prev) => ({ ...prev, weightGrams: 0, stable: false, receivedAt: null }));
    }, []);

    return {
        supported,
        state,
        error,
        reading,
        start,
        stop,
        reset,
    };
}
