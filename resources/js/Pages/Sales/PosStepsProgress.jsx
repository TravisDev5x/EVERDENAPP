import { Check } from 'lucide-react';

const STEPS = [
    { num: 1, label: 'Escanear' },
    { num: 2, label: 'Confirmar' },
    { num: 3, label: 'Cobrar' },
    { num: 4, label: 'Listo' },
];

export default function PosStepsProgress({ activeStep }) {
    return (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            {STEPS.map((step, i) => {
                const done = step.num < activeStep;
                const active = step.num === activeStep;
                return (
                    <div key={step.num} className="flex items-center gap-2">
                        {i > 0 ? (
                            <div className="h-px w-6 shrink-0 bg-border" aria-hidden="true" />
                        ) : null}
                        {done && (
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="flex size-5 items-center justify-center rounded-full bg-primary"
                                    aria-hidden="true"
                                >
                                    <Check className="size-3 text-primary-foreground" />
                                </div>
                            </div>
                        )}
                        {active && (
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="flex size-5 items-center justify-center rounded-full bg-primary"
                                    aria-hidden="true"
                                >
                                    <span className="text-xs font-medium text-primary-foreground">
                                        {step.num}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{step.label}</span>
                            </div>
                        )}
                        {!done && !active && (
                            <div className="flex items-center">
                                <div
                                    className="flex size-5 items-center justify-center rounded-full border border-border"
                                    aria-hidden="true"
                                >
                                    <span className="text-xs text-muted-foreground">{step.num}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
