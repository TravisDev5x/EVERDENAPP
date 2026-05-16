import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head, Link } from '@inertiajs/react';

const messages = {
    no_existe: 'Este enlace de invitación no es válido.',
    expirada: 'Esta invitación ha expirado. Pide una nueva al administrador.',
    accepted: 'Esta invitación ya fue aceptada. Inicia sesión.',
    rejected: 'Esta invitación fue rechazada.',
    cancelled: 'Esta invitación fue cancelada.',
};

export default function Invalid({ reason }) {
    const message = messages[reason] ?? messages.no_existe;

    return (
        <GuestLayout headline="Invitación no disponible" subline="">
            <Head title="Invitación no válida" />

            <Card className="mx-auto max-w-lg">
                <CardHeader>
                    <CardTitle>No se puede continuar</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href={route('login')}>Ir a iniciar sesión</Link>
                    </Button>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
