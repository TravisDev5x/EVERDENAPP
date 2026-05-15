import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function TeamUsers({ users, roles, branches, canManageUsers }) {
    const { auth } = usePage().props;
    const userRows = users?.data ?? [];

    const inviteForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: roles[0]?.id ?? '',
        branch_id: auth.user.branch_id ?? branches[0]?.id ?? '',
    });

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route('team.users.store'), {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset('password', 'password_confirmation'),
        });
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

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <p className="text-sm text-muted-foreground">
                            Aquí ves quién puede entrar al sistema. Los accesos detallados se ajustan en
                            &quot;Accesos&quot; del menú.
                        </p>
                    </div>

                    {canManageUsers && (
                        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                            <h3 className="mb-3 text-lg font-semibold text-foreground">
                                Invitar a alguien
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Crea una cuenta nueva para tu equipo (según el límite de tu plan).
                            </p>
                            <form className="grid max-w-xl gap-3" onSubmit={submitInvite}>
                                <div>
                                    <InputLabel value="Nombre completo" />
                                    <TextInput
                                        className="mt-1 w-full"
                                        value={inviteForm.data.name}
                                        onChange={(e) => inviteForm.setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                    <InputError className="mt-1" message={inviteForm.errors.name} />
                                </div>
                                <div>
                                    <InputLabel value="Correo" />
                                    <TextInput
                                        type="email"
                                        className="mt-1 w-full"
                                        value={inviteForm.data.email}
                                        onChange={(e) => inviteForm.setData('email', e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                    <InputError className="mt-1" message={inviteForm.errors.email} />
                                </div>
                                <div>
                                    <InputLabel value="Contraseña inicial" />
                                    <TextInput
                                        type="password"
                                        className="mt-1 w-full"
                                        value={inviteForm.data.password}
                                        onChange={(e) => inviteForm.setData('password', e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <InputError className="mt-1" message={inviteForm.errors.password} />
                                </div>
                                <div>
                                    <InputLabel value="Confirmar contraseña" />
                                    <TextInput
                                        type="password"
                                        className="mt-1 w-full"
                                        value={inviteForm.data.password_confirmation}
                                        onChange={(e) =>
                                            inviteForm.setData('password_confirmation', e.target.value)
                                        }
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Sucursal" />
                                    <select
                                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                        value={inviteForm.data.branch_id}
                                        onChange={(e) => inviteForm.setData('branch_id', e.target.value)}
                                        required
                                    >
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-1" message={inviteForm.errors.branch_id} />
                                </div>
                                <div>
                                    <InputLabel value="Rol" />
                                    <select
                                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                        value={inviteForm.data.role_id}
                                        onChange={(e) => inviteForm.setData('role_id', e.target.value)}
                                        required
                                    >
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                                {r.is_system ? ' (sistema)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError className="mt-1" message={inviteForm.errors.role_id} />
                                </div>
                                <div>
                                    <PrimaryButton type="submit" disabled={inviteForm.processing}>
                                        Crear usuario
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">
                            Quién tiene acceso
                        </h3>
                        <div className="space-y-4">
                            {userRows.map((u) => (
                                <UserRow
                                    key={u.id}
                                    user={u}
                                    roles={roles}
                                    canManage={canManageUsers}
                                    isSelf={auth.user.id === u.id}
                                />
                            ))}
                        </div>
                        <Pagination className="mt-6" resource={users} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function UserRow({ user, roles, canManage, isSelf }) {
    const form = useForm({ role_id: user.role_id ?? '' });

    const save = (e) => {
        e.preventDefault();
        if (!user.id) return;
        form.patch(route('team.users.update', user.id), { preserveScroll: true });
    };

    return (
        <div className="flex flex-col gap-2 border-b border-border py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                    Perfil: {user.tenant_role?.name ?? '—'}
                </p>
            </div>
            {canManage && !isSelf && (
                <form className="flex flex-wrap items-end gap-2" onSubmit={save}>
                    <div>
                        <label className="sr-only" htmlFor={`role-${user.id}`}>
                            Rol
                        </label>
                        <select
                            id={`role-${user.id}`}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                            value={form.data.role_id}
                            onChange={(e) => form.setData('role_id', e.target.value)}
                        >
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                    {r.is_system ? ' (sistema)' : ''}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.role_id} className="mt-1" />
                    </div>
                    <PrimaryButton disabled={form.processing}>Guardar</PrimaryButton>
                </form>
            )}
            {isSelf && (
                <span className="text-xs text-muted-foreground">Tu usuario (no puedes cambiar tu rol aquí)</span>
            )}
        </div>
    );
}
