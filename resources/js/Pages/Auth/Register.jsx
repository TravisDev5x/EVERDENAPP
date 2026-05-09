import AuthGoogleButton from '@/Components/AuthGoogleButton';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';

const linkEmerald = cn(
    'font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-600 hover:underline',
    'dark:text-emerald-400 dark:hover:text-emerald-300',
);

const inputAuth =
    'h-11 rounded-xl border-input bg-background px-3 md:text-sm';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        business_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        privacy_notice_accepted: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            headline="Crea tu cuenta de demo"
            subline="Registra tu negocio y tu usuario principal para probar ventas, caja e inventario."
        >
            <Head title="Registro" />

            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkEmerald)}>
                        <Link href={route('login')}>Iniciar sesión</Link>
                    </Button>
                </p>
            </div>

            <div className="mb-6 space-y-5">
                <AuthGoogleButton />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide">
                        <span className="bg-card px-3 text-muted-foreground">
                            O registro con correo
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre del propietario</Label>
                    <Input
                        id="name"
                        name="name"
                        value={data.name}
                        className={inputAuth}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="business_name">Nombre del negocio</Label>
                    <Input
                        id="business_name"
                        name="business_name"
                        value={data.business_name}
                        className={inputAuth}
                        autoComplete="organization"
                        onChange={(e) => setData('business_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.business_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={inputAuth}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
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
                        className={inputAuth}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className={inputAuth}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <Card className="border-border bg-muted/40 shadow-none dark:bg-muted/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="privacy_notice_accepted"
                                checked={data.privacy_notice_accepted}
                                onCheckedChange={(v) =>
                                    setData('privacy_notice_accepted', v === true)
                                }
                                className="mt-1 shrink-0"
                            />
                            <Label
                                htmlFor="privacy_notice_accepted"
                                className="block min-w-0 flex-1 cursor-pointer text-sm font-normal leading-relaxed text-foreground"
                            >
                                <span className="inline">
                                    He leído y acepto el{' '}
                                    <Link
                                        href={route('legal.privacy')}
                                        className="font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        aviso de privacidad
                                    </Link>{' '}
                                    y los{' '}
                                    <Link
                                        href={route('legal.terms')}
                                        className="font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        términos del servicio
                                    </Link>
                                    .
                                </span>
                            </Label>
                        </div>
                        <InputError message={errors.privacy_notice_accepted} className="mt-3" />
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="w-full rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 sm:w-auto"
                    >
                        Crear cuenta y continuar
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
