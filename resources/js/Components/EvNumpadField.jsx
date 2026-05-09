import EvNumpad from '@/Components/EvNumpad';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Button } from '@/Components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/Components/ui/sheet';
import { Calculator } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * EvNumpadField - Wrapper opt-in para sumar un EvNumpad junto a inputs ya
 * existentes SIN reescribir el componente padre.
 *
 * Identidad Everden v1: usa Button shadcn (heredando el token primary cuando
 * variant=default) y PrimaryButton para confirmar (Verde Bosque + active:scale).
 */
export default function EvNumpadField({
    value = '',
    onChange,
    mode = 'decimal',
    label = 'Capturar valor',
    description = 'Usa el teclado tactil para capturar el valor exacto.',
    triggerLabel = 'Abrir numpad',
    side = 'right',
    triggerVariant = 'outline',
    triggerSize = 'touch-icon',
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(String(value ?? ''));

    useEffect(() => {
        if (open) setDraft(String(value ?? ''));
    }, [open, value]);

    const handleConfirm = () => {
        onChange?.(draft);
        setOpen(false);
    };

    const handleCancel = () => {
        setDraft(String(value ?? ''));
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    type="button"
                    variant={triggerVariant}
                    size={triggerSize}
                    aria-label={triggerLabel}
                    title={triggerLabel}
                    disabled={disabled}
                >
                    <Calculator aria-hidden="true" />
                    <span className="sr-only">{triggerLabel}</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side={side}
                className="data-[side=right]:sm:max-w-md data-[side=bottom]:max-h-[90vh] flex w-full flex-col gap-0 bg-muted px-0"
            >
                <SheetHeader className="border-b border-border bg-card">
                    <SheetTitle className="text-foreground">{label}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 items-start justify-center overflow-y-auto p-4">
                    <EvNumpad
                        value={draft}
                        onChange={setDraft}
                        mode={mode}
                        showSubmit={false}
                    />
                </div>

                <SheetFooter className="border-t border-border bg-card sm:flex-row sm:justify-end">
                    <SecondaryButton size="touch" type="button" onClick={handleCancel}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton size="touch-lg" type="button" onClick={handleConfirm}>
                        Aceptar
                    </PrimaryButton>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
