import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            headline="Confirmación de seguridad"
            subline="Por tu seguridad, vuelve a escribir tu contraseña antes de continuar en zonas sensibles del sistema."
        >
            <Head title="Confirmar contraseña" />

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Esta área requiere que verifiques tu identidad con la contraseña actual de tu cuenta.
            </p>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="h-11 rounded-xl border-input bg-background px-3 md:text-sm"
                        autoComplete="current-password"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="w-full rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 sm:w-auto"
                    >
                        Confirmar y continuar
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
