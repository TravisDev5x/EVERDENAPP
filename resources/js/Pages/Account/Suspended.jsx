import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function Suspended({
    suspensionScope = 'tenant',
    tenantDisplayName,
    suspensionReason,
}) {
    const isUser = suspensionScope === 'user';

    return (
        <GuestLayout>
            <Head title="Cuenta suspendida" />

            <div className="space-y-4 text-center">
                <h1 className="text-lg font-semibold text-foreground">Cuenta suspendida</h1>
                {isUser ? (
                    <p className="text-sm text-muted-foreground">
                        Tu usuario fue suspendido por la plataforma. No puedes operar el panel de tu negocio hasta que
                        se reactive tu acceso.
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        El acceso para <strong>{tenantDisplayName}</strong> está desactivado por la plataforma (por
                        ejemplo, falta de pago o incumplimiento). Tu equipo no puede operar la aplicación hasta que se
                        reactive la cuenta.
                    </p>
                )}
                {suspensionReason && (
                    <p className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
                        Motivo indicado: {suspensionReason}
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    Si crees que es un error, contacta al soporte de tu proveedor (facturación).
                </p>
            </div>
        </GuestLayout>
    );
}
