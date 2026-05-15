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
                    className="mb-6 border-primary/25 bg-primary/5 text-foreground dark:border-primary/20 dark:bg-primary/10"
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
                        className="w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
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
