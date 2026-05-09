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
        <section className="rounded-xl border border-green-900/15 bg-green-50/80 p-4 shadow-xs dark:border-green-500/20 dark:bg-green-950/20">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-900/70 dark:text-green-300/80">
                        Custodia Everden
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-green-950 dark:text-green-50">
                        Consentimiento de privacidad
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-green-900/75 dark:text-green-100/75">
                        Registra al cliente solo si acepta el Aviso de Privacidad. El ticket puede seguir como venta
                        general si no se capturan datos personales.
                    </p>
                </div>
                <span className="rounded-full bg-green-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-green-400 dark:text-green-950">
                    Verde Bosque
                </span>
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

                <label className="flex items-start gap-3 rounded-lg border border-green-900/10 bg-white/70 p-3 text-sm text-green-950 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-green-50">
                    <input
                        type="checkbox"
                        className="mt-1 rounded border-green-800 text-green-800 focus:ring-green-700 dark:border-green-400 dark:bg-slate-900"
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
