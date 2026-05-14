import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';

const linkEmerald = cn(
    'font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-600 hover:underline',
    'dark:text-emerald-400 dark:hover:text-emerald-300',
);

const inputAuth =
    'h-11 rounded-xl border-input bg-background px-3 md:text-sm';

export default function RegisterGoogle({ prefill }) {
    const { data, setData, post, processing, errors } = useForm({
        name: prefill?.name ?? '',
        business_name: '',
        main_branch_name: '',
        privacy_notice_accepted: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register.google'));
    };

    return (
        <GuestLayout
            headline="Configura tu negocio"
            subline="Confirmamos tu correo con Google. Antes de entrar al panel, define tu nombre, el nombre legal de tu empresa y tu primera sucursal (será la principal)."
        >
            <Head title="Registro con Google" />

            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    ¿Prefieres otro método?{' '}
                    <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkEmerald)}>
                        <Link href={route('register')}>Registro con correo</Link>
                    </Button>
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        value={prefill?.email ?? ''}
                        className={cn(inputAuth, 'bg-muted/50')}
                        readOnly
                        disabled
                        tabIndex={-1}
                        autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                        Proviene de tu cuenta de Google y no se puede cambiar aquí.
                    </p>
                </div>

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
                    <p className="text-xs text-muted-foreground">
                        Así llamaremos a tu empresa en el sistema; se usa para crear tu espacio aislado de datos.
                    </p>
                    <InputError message={errors.business_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="main_branch_name">Nombre de tu primera sucursal</Label>
                    <Input
                        id="main_branch_name"
                        name="main_branch_name"
                        value={data.main_branch_name}
                        className={inputAuth}
                        autoComplete="off"
                        placeholder="Ej. Matriz, Centro, Tienda principal"
                        onChange={(e) => setData('main_branch_name', e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Se crea como sucursal principal; aquí operará tu usuario hasta que agregues más.
                    </p>
                    <InputError message={errors.main_branch_name} />
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
                        Crear tenant y entrar al panel
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
