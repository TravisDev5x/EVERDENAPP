import Pagination from '@/Components/Pagination';
import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';

const INVITATION_STATUS_LABELS = {
    pending: 'Pendiente',
    rejected: 'Rechazada',
};

function formatDate(iso) {
    if (!iso) {
        return '—';
    }
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));
}

function UserStatusBadge({ user }) {
    const suspended = Boolean(user.suspended_at);
    return (
        <Badge variant={suspended ? 'destructive' : 'secondary'}>
            {suspended ? 'Suspendido' : 'Activo'}
        </Badge>
    );
}

function InvitationStatusBadge({ status }) {
    const variant = status === 'rejected' ? 'destructive' : 'outline';
    return (
        <Badge variant={variant}>
            {INVITATION_STATUS_LABELS[status] ?? status}
        </Badge>
    );
}

export default function TeamUsers({ users, roles, invitations = [], canManageUsers }) {
    const { auth, errors: pageErrors } = usePage().props;
    const userRows = users?.data ?? [];

    const inviteForm = useForm({
        email: '',
        role_id: roles[0]?.id ? String(roles[0].id) : '',
    });

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('team.invitations.store'), {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset('email'),
        });
    };

    const resendInvitation = (id) => {
        router.post(route('team.invitations.resend', id), {}, { preserveScroll: true });
    };

    const cancelInvitation = (id) => {
        router.delete(route('team.invitations.cancel', id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Personas del equipo
                </h2>
            }
        >
            <Head title="Equipo" />

            <div className="py-6 pb-24 sm:py-8 md:pb-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Miembros del equipo</CardTitle>
                            <CardDescription>
                                Usuarios con acceso al sistema. Los permisos detallados se configuran en
                                Accesos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <Table className="min-w-[400px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                        <TableHead className="hidden md:table-cell">Rol</TableHead>
                                        <TableHead className="hidden sm:table-cell">Sucursal</TableHead>
                                        <TableHead>Estado</TableHead>
                                        {canManageUsers && <TableHead className="text-right">Acciones</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userRows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={canManageUsers ? 6 : 5}
                                                className="text-center text-muted-foreground"
                                            >
                                                No hay miembros en esta página.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {userRows.map((u) => (
                                        <MemberRow
                                            key={u.id}
                                            user={u}
                                            roles={roles}
                                            canManage={canManageUsers}
                                            isSelf={auth.user.id === u.id}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                            <Pagination className="mt-6" resource={users} />
                        </CardContent>
                    </Card>

                    {canManageUsers && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Invitar miembro</CardTitle>
                                <CardDescription>
                                    Envía un enlace por correo para que la persona cree su acceso (según el
                                    límite de tu plan, incluyendo invitaciones pendientes).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={submitInvite}
                                    className="grid max-w-xl gap-4 sm:grid-cols-2"
                                >
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="invite-email">Correo electrónico</Label>
                                        <Input
                                            id="invite-email"
                                            type="email"
                                            value={inviteForm.data.email}
                                            onChange={(e) => inviteForm.setData('email', e.target.value)}
                                            required
                                            autoComplete="email"
                                            placeholder="empleado@ejemplo.com"
                                        />
                                        <InputError message={inviteForm.errors.email} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="invite-role">Rol</Label>
                                        <Select
                                            value={inviteForm.data.role_id}
                                            onValueChange={(v) => inviteForm.setData('role_id', v)}
                                        >
                                            <SelectTrigger id="invite-role">
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name}
                                                        {r.is_system ? ' (sistema)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={inviteForm.errors.role_id} />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="submit" disabled={inviteForm.processing}>
                                            Enviar invitación
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {canManageUsers && invitations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Invitaciones</CardTitle>
                                <CardDescription>
                                    Pendientes y rechazadas. Puedes reenviar, compartir por WhatsApp o
                                    cancelar las pendientes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pageErrors?.resend && (
                                    <p className="text-sm font-medium text-destructive" role="alert">
                                        {pageErrors.resend}
                                    </p>
                                )}
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <Table className="min-w-[560px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="hidden sm:table-cell">Rol</TableHead>
                                            <TableHead className="hidden md:table-cell">Enviada por</TableHead>
                                            <TableHead className="hidden lg:table-cell">Expira el</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invitations.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{inv.email}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{inv.role?.name ?? '—'}</TableCell>
                                                <TableCell className="hidden md:table-cell">{inv.invited_by?.name ?? '—'}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{formatDate(inv.expires_at)}</TableCell>
                                                <TableCell>
                                                    <InvitationStatusBadge status={inv.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {inv.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="min-h-11"
                                                                    disabled={!inv.can_resend}
                                                                    onClick={() => resendInvitation(inv.id)}
                                                                >
                                                                    Reenviar
                                                                </Button>
                                                                {inv.whatsapp_url && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        asChild
                                                                    >
                                                                        <a
                                                                            href={inv.whatsapp_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <MessageCircle className="mr-1 size-4" />
                                                                            WhatsApp
                                                                        </a>
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => cancelInvitation(inv.id)}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                                {invitations
                                    .filter((inv) => inv.status === 'rejected' && inv.rejection_reason)
                                    .map((inv) => (
                                        <div
                                            key={`reason-${inv.id}`}
                                            className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
                                        >
                                            <p className="font-medium text-foreground">
                                                {inv.email} — motivo del rechazo
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {inv.rejection_reason}
                                            </p>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function MemberRow({ user, roles, canManage, isSelf }) {
    const roleForm = useForm({
        role_id: user.role_id ? String(user.role_id) : '',
    });

    const saveRole = (e) => {
        e.preventDefault();
        if (!user.id) {
            return;
        }
        roleForm.patch(route('team.users.update', user.id), { preserveScroll: true });
    };

    const toggleSuspension = () => {
        const routeName = user.suspended_at ? 'team.users.activate' : 'team.users.suspend';
        router.patch(route(routeName, user.id), {}, { preserveScroll: true });
    };

    return (
        <TableRow>
            <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
            <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
            <TableCell className="hidden md:table-cell">{user.tenant_role?.name ?? '—'}</TableCell>
            <TableCell className="hidden sm:table-cell">{user.branch?.name ?? '—'}</TableCell>
            <TableCell>
                <UserStatusBadge user={user} />
            </TableCell>
            {canManage && (
                <TableCell>
                    {isSelf ? (
                        <span className="text-xs text-muted-foreground">Tu usuario</span>
                    ) : (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <form onSubmit={saveRole} className="flex items-center gap-2">
                                <Select
                                    value={roleForm.data.role_id}
                                    onValueChange={(v) => roleForm.setData('role_id', v)}
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                {r.name}
                                                {r.is_system ? ' (sistema)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" size="sm" variant="secondary" className="min-h-11" disabled={roleForm.processing}>
                                    Guardar
                                </Button>
                            </form>
                            <Button
                                type="button"
                                size="sm"
                                variant={user.suspended_at ? 'secondary' : 'outline'}
                                className="min-h-11"
                                onClick={toggleSuspension}
                            >
                                {user.suspended_at ? 'Reactivar' : 'Suspender'}
                            </Button>
                        </div>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
}
