import GuestLayout from '@/Layouts/GuestLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head } from '@inertiajs/react';

export default function Rejected() {
    return (
        <GuestLayout headline="Invitación rechazada" subline="">
            <Head title="Invitación rechazada" />

            <Card className="mx-auto max-w-lg">
                <CardHeader>
                    <CardTitle>Listo</CardTitle>
                    <CardDescription>
                        Rechazaste la invitación. El administrador fue notificado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Puedes cerrar esta ventana. Si fue un error, pide al administrador que te envíe una nueva
                        invitación.
                    </p>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
