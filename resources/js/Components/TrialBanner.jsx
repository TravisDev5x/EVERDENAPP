import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';

function trialMessage(days) {
    if (days === 0) {
        return 'Tu período de prueba venció hoy.';
    }
    if (days === 1) {
        return 'Te queda 1 día de prueba gratuita.';
    }
    return `Te quedan ${days} días de prueba gratuita.`;
}

export default function TrialBanner({ tenant, isPlatformOperator }) {
    if (isPlatformOperator || tenant == null || !tenant.is_on_trial) {
        return null;
    }

    const days = tenant.trial_days_left ?? 0;
    const isUrgent = days <= 3;
    const isWarning = days > 3 && days <= 7;
    const variant = isUrgent ? 'destructive' : 'default';

    return (
        <div className="safe-px mx-auto w-full max-w-7xl pt-3 sm:pt-4">
            <Alert
                variant={variant}
                role="alert"
                aria-live="polite"
                className={cn(
                    'rounded-xl',
                    isWarning &&
                        'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400',
                )}
            >
                <Clock className="size-4 shrink-0" aria-hidden />
                <AlertTitle>{trialMessage(days)}</AlertTitle>
                <AlertDescription>
                    Activa tu plan para seguir operando sin interrupciones.
                </AlertDescription>
                <AlertAction>
                    <Button size="sm" variant={isUrgent ? 'destructive' : 'default'} asChild>
                        <Link href={route('tenant.billing')}>Activar plan</Link>
                    </Button>
                </AlertAction>
            </Alert>
        </div>
    );
}
