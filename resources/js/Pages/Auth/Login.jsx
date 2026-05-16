import AuthGoogleButton from '@/Components/AuthGoogleButton';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const linkPrimary = cn(
    'font-semibold text-primary underline-offset-2 hover:text-primary/90 hover:underline',
);

export default function Login({ status, canResetPassword }) {
    const sharedErrors = usePage().props.errors ?? {};

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            headline="Bienvenido de nuevo"
            subline="Inicia sesión con el correo de tu cuenta para entrar al panel de tu negocio."
        >
            <Head title="Iniciar sesión" />

            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    ¿Aún no tienes cuenta?{' '}
                    <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkPrimary)}>
                        <Link href={route('register')}>Crear cuenta de demo</Link>
                    </Button>
                </p>
            </div>

            {status ? (
                <Alert
                    className="mb-6 border-primary/25 bg-primary/5 text-foreground dark:border-primary/20 dark:bg-primary/10"
                    role="status"
                >
                    <AlertDescription className="text-current">{status}</AlertDescription>
                </Alert>
            ) : null}

            {sharedErrors.oauth ? (
                <Alert variant="destructive" className="mb-6" role="alert">
                    <AlertDescription>{sharedErrors.oauth}</AlertDescription>
                </Alert>
            ) : null}

            <div className="mb-6 space-y-5">
                <AuthGoogleButton />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide">
                        <span className="bg-card px-3 text-muted-foreground">
                            O con correo y contraseña
                        </span>
                    </div>
                </div>
            </div>

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

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="h-11 rounded-xl border-input bg-background px-3 md:text-sm"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(v) => setData('remember', v === true)}
                        />
                        <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">
                            Mantener sesión en este dispositivo
                        </Label>
                    </div>

                    {canResetPassword ? (
                        <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkPrimary)}>
                            <Link href={route('password.request')}>¿Olvidaste tu contraseña?</Link>
                        </Button>
                    ) : null}
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
                    >
                        Entrar al panel
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
