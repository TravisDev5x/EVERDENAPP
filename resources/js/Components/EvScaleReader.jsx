import EvOperationalAlert from '@/Components/EvOperationalAlert';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useSerialScale } from '@/hooks/use-serial-scale';
import { useEffect, useState } from 'react';

const PROTOCOL_OPTIONS = [
    { id: 'nci', label: 'NCI / SCP (Toledo, CAS, Aclas, Torrey)' },
    { id: 'raw_kg', label: 'Linea simple en kg (firmware generico)' },
];

function formatKg(weightGrams, unit) {
    if (!weightGrams || weightGrams <= 0) return '0.000 kg';
    if (unit === 'g') {
        const grams = weightGrams;
        if (grams < 1000) return `${grams} g`;
    }
    return `${(weightGrams / 1000).toFixed(3)} kg`;
}

/**
 * EvScaleReader - Lectura precisa de basculas Web Serial.
 * Identidad Everden v1: superficie tokenizada (bg-card/border-border) con
 * encabezado en Verde Bosque (--primary).
 */
export default function EvScaleReader({
    onCapture,
    defaultProtocol = 'nci',
    autoStart = false,
    helpText = 'Conecta la bascula via USB-Serial. Web Serial requiere HTTPS o localhost en Chrome/Edge.',
}) {
    const [protocol, setProtocol] = useState(defaultProtocol);
    const scale = useSerialScale({ protocol });

    useEffect(() => {
        if (autoStart && scale.supported && scale.state === 'idle') {
            scale.start().catch(() => undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
    }, []);

    const handleCapture = () => {
        if (!scale.reading.stable || scale.reading.weightGrams <= 0) return;
        onCapture?.({
            weightGrams: scale.reading.weightGrams,
            unit: scale.reading.unit,
            quantityKg: Number((scale.reading.weightGrams / 1000).toFixed(3)),
            capturedAt: Date.now(),
        });
        scale.reset();
    };

    if (!scale.supported) {
        return (
            <EvOperationalAlert
                variant="warning"
                title="Bascula no disponible en este navegador"
                description="Usa Chrome o Edge sobre HTTPS o localhost para conectar la bascula. Mientras tanto puedes capturar el peso manualmente."
            />
        );
    }

    const stable = scale.reading.stable && scale.reading.weightGrams > 0;
    const showError = scale.state === 'error' || scale.error;

    return (
        <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Lectura precisa
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">Bascula Everden</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helpText}</p>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        scale.state === 'reading'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {scale.state === 'reading' ? 'En linea' : 'Sin sesion'}
                </span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="flex flex-col text-xs text-foreground/80">
                    <span className="mb-1 font-semibold">Protocolo</span>
                    <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                        value={protocol}
                        onChange={(event) => setProtocol(event.target.value)}
                        disabled={scale.state === 'reading'}
                    >
                        {PROTOCOL_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                {scale.state !== 'reading' ? (
                    <PrimaryButton size="touch" type="button" onClick={() => scale.start()}>
                        Conectar bascula
                    </PrimaryButton>
                ) : (
                    <SecondaryButton size="touch" type="button" onClick={() => scale.stop()}>
                        Desconectar
                    </SecondaryButton>
                )}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-5 text-center">
                <p
                    className={`text-3xl font-bold tabular-nums tracking-tight ${
                        stable ? 'text-primary' : 'text-amber-700 dark:text-amber-300'
                    }`}
                >
                    {formatKg(scale.reading.weightGrams, scale.reading.unit)}
                </p>
                <p
                    className={`mt-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        stable ? 'text-primary' : 'text-amber-700 dark:text-amber-300'
                    }`}
                >
                    {scale.state === 'reading'
                        ? stable
                            ? 'Lectura estable'
                            : 'Estabilizando…'
                        : 'Sin lectura'}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <PrimaryButton size="touch-lg" type="button" onClick={handleCapture} disabled={!stable}>
                    Capturar peso al ticket
                </PrimaryButton>
                <SecondaryButton size="touch" type="button" onClick={scale.reset} disabled={scale.state !== 'reading'}>
                    Reiniciar lectura
                </SecondaryButton>
            </div>

            {showError ? (
                <div className="mt-3">
                    <EvOperationalAlert
                        variant="error"
                        title="Bascula con incidencia"
                        description={scale.error ?? 'Lectura interrumpida. Verifica conexion y reintenta.'}
                    />
                </div>
            ) : null}
        </section>
    );
}
