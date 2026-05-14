import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';

const linkEmerald = cn(
    'font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-600 hover:underline',
    'dark:text-emerald-400 dark:hover:text-emerald-300',
);

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            headline="Recuperar acceso"
            subline="Te enviaremos un enlace para crear una contraseña nueva. Usa el correo con el que registraste tu cuenta."
        >
            <Head title="Recuperar contraseña" />

            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkEmerald)}>
                        <Link href={route('login')}>Volver al inicio de sesión</Link>
                    </Button>
                </p>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Indica tu correo y revisa la bandeja (y spam). El enlace caduca pasado un tiempo por seguridad.
            </p>

            {status ? (
                <Alert
                    className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    role="status"
                >
                    <AlertDescription className="text-current">{status}</AlertDescription>
                </Alert>
            ) : null}

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="h-11 rounded-xl border-input bg-background px-3 md:text-sm"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="w-full rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 sm:w-auto"
                    >
                        Enviar enlace de restablecimiento
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
