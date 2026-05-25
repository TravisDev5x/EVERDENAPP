import InputError from '@/Components/InputError';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

function digitsOnly(value, maxLength = 4) {
    return value.replace(/\D/g, '').slice(0, maxLength);
}

function formatDateTime(iso) {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(iso));
}

function PinField({ id, label, value, onChange, error }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={value}
                onChange={(e) => onChange(digitsOnly(e.target.value))}
            />
            <InputError message={error} />
        </div>
    );
}

export default function UserProfile({ user }) {
    const profileForm = useForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        whatsapp: user.whatsapp ?? '',
        employee_number: user.employee_number ?? '',
        birth_date: user.birth_date ?? '',
        hire_date: user.hire_date ?? '',
    });

    const pinForm = useForm({
        pin: '',
        pin_confirmation: '',
        current_password: '',
    });

    const clearPinForm = useForm({
        current_password: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.patch(route('user.profile.update'), { preserveScroll: true });
    };

    const submitPin = (e) => {
        e.preventDefault();
        pinForm.post(route('user.profile.pin.set'), {
            preserveScroll: true,
            onSuccess: () => pinForm.reset(),
        });
    };

    const submitClearPin = (e) => {
        e.preventDefault();
        router.delete(route('user.profile.pin.clear'), {
            data: { current_password: clearPinForm.data.current_password },
            preserveScroll: true,
            onSuccess: () => clearPinForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Mi perfil
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Información personal y seguridad de tu cuenta
                    </p>
                </div>
            }
        >
            <Head title="Mi perfil" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mi perfil</CardTitle>
                            <CardDescription>Datos personales de tu cuenta</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email">Correo electrónico</Label>
                                    <Input id="email" value={user.email ?? ''} disabled />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="name">Nombre completo *</Label>
                                    <Input
                                        id="name"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={profileForm.errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono personal</Label>
                                    <Input
                                        id="phone"
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                        placeholder="+52 55 1234 5678"
                                    />
                                    <InputError message={profileForm.errors.phone} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp personal</Label>
                                    <Input
                                        id="whatsapp"
                                        value={profileForm.data.whatsapp}
                                        onChange={(e) => profileForm.setData('whatsapp', e.target.value)}
                                        placeholder="+52 55 1234 5678"
                                    />
                                    <InputError message={profileForm.errors.whatsapp} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employee_number">Número de empleado</Label>
                                    <Input
                                        id="employee_number"
                                        value={profileForm.data.employee_number}
                                        onChange={(e) =>
                                            profileForm.setData('employee_number', e.target.value)
                                        }
                                    />
                                    <InputError message={profileForm.errors.employee_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={profileForm.data.birth_date}
                                        onChange={(e) =>
                                            profileForm.setData('birth_date', e.target.value)
                                        }
                                    />
                                    <InputError message={profileForm.errors.birth_date} />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="hire_date">Fecha de ingreso</Label>
                                    <Input
                                        id="hire_date"
                                        type="date"
                                        value={profileForm.data.hire_date}
                                        onChange={(e) =>
                                            profileForm.setData('hire_date', e.target.value)
                                        }
                                    />
                                    <InputError message={profileForm.errors.hire_date} />
                                </div>

                                <div className="sm:col-span-2">
                                    <Button type="submit" disabled={profileForm.processing}>
                                        {profileForm.processing ? 'Guardando…' : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>PIN de caja</CardTitle>
                            <CardDescription>
                                Tu PIN de 4 dígitos se usará para confirmar acciones sensibles en
                                el sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {user.has_pin ? (
                                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                                    PIN configurado
                                </Badge>
                            ) : (
                                <Badge variant="outline">Sin PIN configurado</Badge>
                            )}

                            {user.has_pin ? (
                                <p className="text-sm text-muted-foreground">
                                    Configurado el {formatDateTime(user.pin_set_at)}
                                </p>
                            ) : null}

                            <form onSubmit={submitPin} className="grid max-w-md gap-4">
                                <PinField
                                    id="pin"
                                    label={user.has_pin ? 'PIN nuevo' : 'PIN'}
                                    value={pinForm.data.pin}
                                    onChange={(value) => pinForm.setData('pin', value)}
                                    error={pinForm.errors.pin}
                                />
                                <PinField
                                    id="pin_confirmation"
                                    label={user.has_pin ? 'Confirmar PIN nuevo' : 'Confirmar PIN'}
                                    value={pinForm.data.pin_confirmation}
                                    onChange={(value) => pinForm.setData('pin_confirmation', value)}
                                    error={pinForm.errors.pin_confirmation}
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="current_password_pin">Contraseña actual</Label>
                                    <Input
                                        id="current_password_pin"
                                        type="password"
                                        autoComplete="current-password"
                                        value={pinForm.data.current_password}
                                        onChange={(e) =>
                                            pinForm.setData('current_password', e.target.value)
                                        }
                                    />
                                    <InputError message={pinForm.errors.current_password} />
                                </div>
                                <Button type="submit" disabled={pinForm.processing}>
                                    {pinForm.processing
                                        ? 'Procesando…'
                                        : user.has_pin
                                          ? 'Cambiar PIN'
                                          : 'Configurar PIN'}
                                </Button>
                            </form>

                            {user.has_pin ? (
                                <form
                                    onSubmit={submitClearPin}
                                    className="grid max-w-md gap-4 border-t border-border pt-6"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password_clear">
                                            Contraseña actual para eliminar PIN
                                        </Label>
                                        <Input
                                            id="current_password_clear"
                                            type="password"
                                            autoComplete="current-password"
                                            value={clearPinForm.data.current_password}
                                            onChange={(e) =>
                                                clearPinForm.setData(
                                                    'current_password',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={clearPinForm.errors.current_password}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={clearPinForm.processing}
                                    >
                                        Eliminar PIN
                                    </Button>
                                </form>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
