import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            headline="Verifica tu correo"
            subline="Activa tu cuenta con el enlace que enviamos. Si no llegó, revisa spam o solicita un nuevo correo."
        >
            <Head title="Verificar correo" />

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Gracias por registrarte. Para continuar, abre el mensaje que enviamos y pulsa el enlace de verificación.
                Si no lo ves en la bandeja de entrada, revisa también correo no deseado.
            </p>

            {status === 'verification-link-sent' ? (
                <Alert
                    className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    role="status"
                >
                    <AlertDescription className="text-current">
                        Hemos enviado un nuevo enlace de verificación al correo que indicaste al registrarte.
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={submit} className="inline">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="w-full rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 sm:w-auto"
                    >
                        Reenviar correo de verificación
                    </Button>
                </form>

                <Button variant="outline" size="lg" asChild className="w-full rounded-xl sm:w-auto">
                    <Link href={route('logout')} method="post" as="button">
                        Cerrar sesión
                    </Link>
                </Button>
            </div>
        </GuestLayout>
    );
}
