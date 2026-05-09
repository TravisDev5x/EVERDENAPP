import { Button } from '@/Components/ui/button';
import { Delete } from 'lucide-react';

/**
 * EvNumpad - Teclado numerico Touch-First Everden v1.
 *
 * Identidad jerarquica:
 *  - Tecla de confirmacion: Verde Bosque (--primary).
 *  - Acentos (punto, doble cero): Esmeralda suave (--secondary).
 *  - Borrar (backspace): ambar.
 *  - Limpiar (C): destructive.
 *  - Foco unico: --ring (Esmeralda).
 *
 * Componente totalmente CONTROLADO: padre maneja `value` y recibe `onChange`.
 *
 * Modos:
 *  - integer:  solo digitos.
 *  - decimal:  un solo punto, hasta 3 decimales (cantidades / kg).
 *  - currency: un solo punto, hasta 2 decimales (montos MXN).
 */
const MODE_RULES = {
    integer: { allowDot: false, maxDecimals: 0 },
    decimal: { allowDot: true, maxDecimals: 3 },
    currency: { allowDot: true, maxDecimals: 2 },
};

function appendChar(current, char, mode) {
    const rules = MODE_RULES[mode] ?? MODE_RULES.decimal;
    const value = String(current ?? '');

    if (char === '.') {
        if (!rules.allowDot) return value;
        if (value.includes('.')) return value;
        if (value === '') return '0.';
        return value + '.';
    }

    if (char === '00') {
        if (value === '' || value === '0') return value;
        const [, frac = ''] = value.split('.');
        if (value.includes('.') && frac.length + 2 > rules.maxDecimals) return value;
        return value + '00';
    }

    if (value === '0' && char !== '.') {
        return char;
    }

    if (value.includes('.') && rules.maxDecimals > 0) {
        const [, frac = ''] = value.split('.');
        if (frac.length >= rules.maxDecimals) return value;
    }

    return value + char;
}

function backspaceValue(current) {
    const value = String(current ?? '');
    if (value.length <= 1) return '';
    return value.slice(0, -1);
}

function NumpadKey({ children, onClick, tone = 'digit', srLabel, disabled = false }) {
    const palette = {
        digit:
            'bg-card text-foreground ring-1 ring-border hover:bg-muted',
        muted:
            'bg-secondary text-secondary-foreground ring-1 ring-primary/15 hover:bg-secondary/80',
        warning:
            'bg-amber-50 text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-500/30',
        danger:
            'bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20',
        confirm:
            'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary hover:bg-primary/90',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={srLabel}
            className={`flex h-14 items-center justify-center rounded-xl text-xl font-semibold tabular-nums transition-all select-none active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40 ${palette[tone]}`}
        >
            {children}
        </button>
    );
}

export default function EvNumpad({
    value = '',
    onChange,
    mode = 'decimal',
    placeholder = '0',
    onSubmit,
    showSubmit = false,
    submitLabel = 'Aceptar',
    onClear,
    label,
    helper,
}) {
    const safeMode = MODE_RULES[mode] ? mode : 'decimal';
    const display = String(value ?? '');

    const emit = (next) => {
        onChange?.(next);
    };

    const handleDigit = (digit) => emit(appendChar(display, digit, safeMode));
    const handleBackspace = () => emit(backspaceValue(display));
    const handleClear = () => {
        emit('');
        onClear?.();
    };

    const dotKeyDisabled = !MODE_RULES[safeMode].allowDot;

    return (
        <section
            data-slot="ev-numpad"
            className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
            {label ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                </p>
            ) : null}

            <div className="rounded-xl border border-border bg-muted px-4 py-3 text-right text-3xl font-bold tabular-nums tracking-tight text-foreground shadow-inner">
                {display === '' ? (
                    <span className="text-muted-foreground/60">{placeholder}</span>
                ) : (
                    display
                )}
            </div>

            {helper ? (
                <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p>
            ) : null}

            <div className="grid grid-cols-4 gap-2">
                <NumpadKey onClick={() => handleDigit('7')} srLabel="Siete">7</NumpadKey>
                <NumpadKey onClick={() => handleDigit('8')} srLabel="Ocho">8</NumpadKey>
                <NumpadKey onClick={() => handleDigit('9')} srLabel="Nueve">9</NumpadKey>
                <NumpadKey onClick={handleBackspace} tone="warning" srLabel="Borrar ultimo digito">
                    <Delete aria-hidden="true" className="size-6" />
                </NumpadKey>

                <NumpadKey onClick={() => handleDigit('4')} srLabel="Cuatro">4</NumpadKey>
                <NumpadKey onClick={() => handleDigit('5')} srLabel="Cinco">5</NumpadKey>
                <NumpadKey onClick={() => handleDigit('6')} srLabel="Seis">6</NumpadKey>
                <NumpadKey onClick={handleClear} tone="danger" srLabel="Limpiar valor">
                    C
                </NumpadKey>

                <NumpadKey onClick={() => handleDigit('1')} srLabel="Uno">1</NumpadKey>
                <NumpadKey onClick={() => handleDigit('2')} srLabel="Dos">2</NumpadKey>
                <NumpadKey onClick={() => handleDigit('3')} srLabel="Tres">3</NumpadKey>
                <NumpadKey
                    onClick={() => handleDigit('.')}
                    tone="muted"
                    srLabel="Punto decimal"
                    disabled={dotKeyDisabled}
                >
                    .
                </NumpadKey>

                <div className="col-span-2">
                    <NumpadKey onClick={() => handleDigit('0')} srLabel="Cero">
                        0
                    </NumpadKey>
                </div>
                <NumpadKey
                    onClick={() => handleDigit('00')}
                    tone="muted"
                    srLabel="Doble cero"
                    disabled={safeMode === 'integer' && display === ''}
                >
                    00
                </NumpadKey>
                {showSubmit ? (
                    <NumpadKey onClick={() => onSubmit?.(display)} tone="confirm" srLabel={submitLabel}>
                        <span className="text-base">{submitLabel}</span>
                    </NumpadKey>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        size="touch"
                        onClick={handleClear}
                        className="h-14 rounded-xl text-foreground"
                    >
                        Limpiar
                    </Button>
                )}
            </div>
        </section>
    );
}

export { appendChar, backspaceValue };
