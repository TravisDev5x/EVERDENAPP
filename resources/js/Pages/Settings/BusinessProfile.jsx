import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Progress } from '@/Components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const BUSINESS_TYPES = [
    { value: 'minisuper', label: 'Minisuper' },
    { value: 'farmacia', label: 'Farmacia' },
    { value: 'papeleria', label: 'Papelería' },
    { value: 'ferreteria', label: 'Ferretería' },
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'cafeteria', label: 'Cafetería' },
    { value: 'tienda_ropa', label: 'Tienda de ropa' },
    { value: 'otro', label: 'Otro' },
];

const TIMEZONES = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (Centro)' },
    { value: 'America/Monterrey', label: 'Monterrey (Noreste)' },
    { value: 'America/Tijuana', label: 'Tijuana (Pacífico)' },
    { value: 'America/Hermosillo', label: 'Hermosillo (Sonora)' },
    { value: 'America/Cancun', label: 'Cancún (Quintana Roo)' },
    { value: 'America/Chihuahua', label: 'Chihuahua (Montaña)' },
];

const MEXICAN_STATES = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila',
    'Colima',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'México',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas',
];

function Field({ id, label, error, children, className }) {
    return (
        <div className={className ?? 'space-y-2'}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

export default function BusinessProfile({ tenant }) {
    const { data, setData, patch, errors, processing } = useForm({
        name: tenant.name ?? '',
        trade_name: tenant.trade_name ?? '',
        business_type: tenant.business_type ?? '',
        phone: tenant.phone ?? '',
        whatsapp: tenant.whatsapp ?? '',
        contact_email: tenant.contact_email ?? '',
        website: tenant.website ?? '',
        street: tenant.street ?? '',
        neighborhood: tenant.neighborhood ?? '',
        city: tenant.city ?? '',
        state: tenant.state ?? '',
        zip_code: tenant.zip_code ?? '',
        rfc: tenant.rfc ?? '',
        ticket_footer: tenant.ticket_footer ?? '',
        timezone: tenant.timezone ?? 'America/Mexico_City',
    });

    const completion = tenant.completion ?? 0;
    const isComplete = completion >= 80;
    const ticketFooterLength = data.ticket_footer?.length ?? 0;

    const submit = (e) => {
        e.preventDefault();
        patch(route('tenant.profile.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Perfil del negocio
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configura la información de tu negocio
                    </p>
                </div>
            }
        >
            <Head title="Perfil del negocio" />

            <div className="py-8">
                <form
                    onSubmit={submit}
                    className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Completitud del perfil</CardTitle>
                            <CardDescription>
                                {completion}% completado
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Progress value={completion} />
                            <p
                                className={
                                    isComplete
                                        ? 'text-sm font-medium text-emerald-600 dark:text-emerald-400'
                                        : 'text-sm font-medium text-amber-600 dark:text-amber-400'
                                }
                            >
                                {isComplete
                                    ? '¡Perfil completo!'
                                    : 'Completa tu perfil para tener todo listo'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Información del negocio</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field id="name" label="Nombre comercial *" error={errors.name} className="space-y-2 sm:col-span-2">
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </Field>

                            <Field id="trade_name" label="Razón social" error={errors.trade_name} className="space-y-2 sm:col-span-2">
                                <Input
                                    id="trade_name"
                                    value={data.trade_name}
                                    onChange={(e) => setData('trade_name', e.target.value)}
                                />
                            </Field>

                            <Field id="business_type" label="Giro del negocio" error={errors.business_type}>
                                <Select
                                    value={data.business_type || undefined}
                                    onValueChange={(v) => setData('business_type', v)}
                                >
                                    <SelectTrigger id="business_type">
                                        <SelectValue placeholder="Selecciona un giro" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BUSINESS_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field id="timezone" label="Zona horaria" error={errors.timezone}>
                                <Select
                                    value={data.timezone || undefined}
                                    onValueChange={(v) => setData('timezone', v)}
                                >
                                    <SelectTrigger id="timezone">
                                        <SelectValue placeholder="Selecciona zona horaria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Información de contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field id="phone" label="Teléfono" error={errors.phone}>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+52 55 1234 5678"
                                />
                            </Field>

                            <Field id="whatsapp" label="WhatsApp" error={errors.whatsapp}>
                                <Input
                                    id="whatsapp"
                                    value={data.whatsapp}
                                    onChange={(e) => setData('whatsapp', e.target.value)}
                                    placeholder="+52 55 1234 5678"
                                />
                            </Field>

                            <Field id="contact_email" label="Email de contacto" error={errors.contact_email}>
                                <Input
                                    id="contact_email"
                                    type="email"
                                    value={data.contact_email}
                                    onChange={(e) => setData('contact_email', e.target.value)}
                                    placeholder="contacto@minegocio.com"
                                />
                            </Field>

                            <Field id="website" label="Sitio web" error={errors.website}>
                                <Input
                                    id="website"
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://minegocio.com"
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Domicilio fiscal</CardTitle>
                            <CardDescription>
                                Esta información se usará en facturas electrónicas (próximamente)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field id="street" label="Calle y número" error={errors.street} className="space-y-2 sm:col-span-2">
                                <Input
                                    id="street"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                />
                            </Field>

                            <Field id="neighborhood" label="Colonia" error={errors.neighborhood}>
                                <Input
                                    id="neighborhood"
                                    value={data.neighborhood}
                                    onChange={(e) => setData('neighborhood', e.target.value)}
                                />
                            </Field>

                            <Field id="city" label="Ciudad" error={errors.city}>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                />
                            </Field>

                            <Field id="state" label="Estado" error={errors.state}>
                                <Select
                                    value={data.state || undefined}
                                    onValueChange={(v) => setData('state', v)}
                                >
                                    <SelectTrigger id="state">
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEXICAN_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field id="zip_code" label="Código postal" error={errors.zip_code}>
                                <Input
                                    id="zip_code"
                                    value={data.zip_code}
                                    onChange={(e) => setData('zip_code', e.target.value)}
                                    maxLength={10}
                                />
                            </Field>

                            <Field id="rfc" label="RFC" error={errors.rfc} className="space-y-2 sm:col-span-2">
                                <Input
                                    id="rfc"
                                    value={data.rfc}
                                    onChange={(e) => setData('rfc', e.target.value.toUpperCase())}
                                    maxLength={13}
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket de venta</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Field id="ticket_footer" label="Mensaje al pie del ticket" error={errors.ticket_footer}>
                                <Textarea
                                    id="ticket_footer"
                                    value={data.ticket_footer}
                                    onChange={(e) => setData('ticket_footer', e.target.value)}
                                    placeholder="¡Gracias por su compra!"
                                    maxLength={200}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {ticketFooterLength}/200 caracteres
                                </p>
                            </Field>
                        </CardContent>
                    </Card>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
