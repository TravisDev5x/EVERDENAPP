import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const email = auth?.user?.email ?? '';
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout headline="Verifica tu correo" subline="Activa tu cuenta con el enlace que te enviamos.">
            <Head title="Verificar correo" />

            <Card className="border-border bg-card/95 shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl">Confirma tu correo</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                        Te enviamos un enlace de verificación a {email}. Revisa tu bandeja de entrada y tu carpeta de
                        spam.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {status === 'verification-link-sent' ? (
                        <Alert
                            className="border-primary/25 bg-primary/5 text-foreground dark:border-primary/20 dark:bg-primary/10"
                            role="status"
                        >
                            <AlertDescription className="text-current">Correo reenviado.</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={submit} className="inline w-full sm:w-auto">
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
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
