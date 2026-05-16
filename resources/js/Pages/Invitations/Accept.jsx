import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Head, useForm } from '@inertiajs/react';

function formatDate(iso) {
    if (!iso) {
        return '—';
    }
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(iso));
}

export default function Accept({ invitation }) {
    const acceptForm = useForm({
        name: '',
        password: '',
        password_confirmation: '',
    });

    const rejectForm = useForm({
        reason: '',
    });

    const submitAccept = (e) => {
        e.preventDefault();
        acceptForm.post(route('invitations.accept.store', invitation.token), {
            onFinish: () => acceptForm.reset('password', 'password_confirmation'),
        });
    };

    const submitReject = (e) => {
        e.preventDefault();
        rejectForm.post(route('invitations.reject', invitation.token));
    };

    return (
        <GuestLayout
            headline={`Únete a ${invitation.tenant_name}`}
            subline={`${invitation.invited_by} te invitó como ${invitation.role_name}.`}
        >
            <Head title="Aceptar invitación" />

            <div className="mx-auto w-full max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Invitación al equipo</CardTitle>
                        <CardDescription>
                            Correo: <strong>{invitation.email}</strong>
                            <br />
                            Válida hasta el {formatDate(invitation.expires_at)}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitAccept} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tu nombre completo</Label>
                                <Input
                                    id="name"
                                    value={acceptForm.data.name}
                                    onChange={(e) => acceptForm.setData('name', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <InputError message={acceptForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={acceptForm.data.password}
                                    onChange={(e) => acceptForm.setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                                <InputError message={acceptForm.errors.password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={acceptForm.data.password_confirmation}
                                    onChange={(e) =>
                                        acceptForm.setData('password_confirmation', e.target.value)
                                    }
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={acceptForm.processing}>
                                Aceptar invitación
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">¿No quieres unirte?</CardTitle>
                        <CardDescription>
                            Puedes rechazar la invitación. El administrador verá tu motivo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitReject} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Motivo del rechazo</Label>
                                <Textarea
                                    id="reason"
                                    value={rejectForm.data.reason}
                                    onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                    required
                                    maxLength={500}
                                    rows={3}
                                />
                                <InputError message={rejectForm.errors.reason} />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={rejectForm.processing}
                            >
                                Rechazar invitación
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </GuestLayout>
    );
}
