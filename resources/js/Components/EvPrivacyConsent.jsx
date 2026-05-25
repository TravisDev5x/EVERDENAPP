import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm } from '@inertiajs/react';

export default function EvPrivacyConsent({ sale }) {
    const form = useForm({
        sale_id: sale?.id ?? null,
        name: '',
        email: '',
        phone: '',
        tax_id: '',
        notes: '',
        privacy_accepted: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (!sale?.id || sale.status !== 'draft') return;

        form.post(route('customers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('name', 'email', 'phone', 'tax_id', 'notes', 'privacy_accepted');
            },
        });
    };

    if (!sale || sale.status !== 'draft') {
        return null;
    }

    return (
        <section className="rounded-xl border border-border bg-muted/40 p-4 shadow-xs dark:bg-muted/20">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Custodia Aberden
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                    Consentimiento de privacidad
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Registra al cliente solo si acepta el Aviso de Privacidad. El ticket puede seguir como venta
                    general si no se capturan datos personales.
                </p>
            </div>

            <form className="mt-4 space-y-3" onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="customer_name" value="Nombre del cliente" />
                    <TextInput
                        id="customer_name"
                        className="mt-1 block w-full"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Ej. Maria Lopez"
                    />
                    <InputError className="mt-1" message={form.errors.name} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="customer_email" value="Correo" />
                        <TextInput
                            id="customer_email"
                            className="mt-1 block w-full"
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            placeholder="cliente@correo.com"
                        />
                        <InputError className="mt-1" message={form.errors.email} />
                    </div>
                    <div>
                        <InputLabel htmlFor="customer_phone" value="Telefono" />
                        <TextInput
                            id="customer_phone"
                            className="mt-1 block w-full"
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            placeholder="+52..."
                        />
                        <InputError className="mt-1" message={form.errors.phone} />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="customer_tax_id" value="RFC (opcional)" />
                    <TextInput
                        id="customer_tax_id"
                        className="mt-1 block w-full uppercase"
                        value={form.data.tax_id}
                        onChange={(e) => form.setData('tax_id', e.target.value.toUpperCase())}
                        placeholder="RFC para facturacion"
                    />
                    <InputError className="mt-1" message={form.errors.tax_id} />
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm text-foreground">
                    <input
                        type="checkbox"
                        className="mt-1 rounded border-input text-primary focus:ring-ring"
                        checked={form.data.privacy_accepted}
                        onChange={(e) => form.setData('privacy_accepted', e.target.checked)}
                    />
                    <span>
                        El cliente acepto el{' '}
                        <Link href={route('legal.privacy')} className="font-semibold underline" target="_blank">
                            Aviso de Privacidad
                        </Link>{' '}
                        del comercio antes de guardar sus datos.
                    </span>
                </label>
                <InputError message={form.errors.privacy_accepted} />

                <PrimaryButton disabled={form.processing || !form.data.privacy_accepted}>
                    Guardar cliente con consentimiento
                </PrimaryButton>
            </form>
        </section>
    );
}
