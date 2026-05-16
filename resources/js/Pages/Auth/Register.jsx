import AuthGoogleButton from '@/Components/AuthGoogleButton';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Check, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const linkPrimary = cn(
    'font-semibold text-primary underline-offset-2 hover:text-primary/90 hover:underline',
);

const inputAuth =
    'h-11 rounded-xl border-input bg-background px-3 md:text-sm';

function formatLimit(value) {
    return value === -1 ? 'Ilimitado' : value;
}

function formatPriceMxn(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function PlanGrid({ plans, selectedId, onSelect }) {
    if (!plans?.length) {
        return (
            <p className="text-center text-sm text-muted-foreground">
                Planes no disponibles.
            </p>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
                const selected = String(selectedId) === String(plan.id);
                const isHighlight = plan.slug === 'pro';
                return (
                    <button
                        key={plan.id}
                        type="button"
                        onClick={() => onSelect(plan.id)}
                        className={cn(
                            'relative flex h-full flex-col rounded-xl border bg-card p-4 text-left shadow-xs transition hover:shadow-md',
                            selected
                                ? 'border-2 border-primary ring-1 ring-primary/20'
                                : 'border-border',
                        )}
                    >
                        {isHighlight ? (
                            <Badge className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 bg-primary px-2 py-0.5 text-[10px] font-semibold normal-case text-primary-foreground">
                                Recomendado
                            </Badge>
                        ) : null}
                        <p className="text-base font-semibold text-foreground">{plan.name}</p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                            {formatPriceMxn(plan.price_mxn)}
                            <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                        </p>
                        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                            <li className="flex gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                {formatLimit(plan.max_users)} usuarios
                            </li>
                            <li className="flex gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                {formatLimit(plan.max_products)} productos
                            </li>
                            <li className="flex gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                {formatLimit(plan.max_branches)} sucursal(es)
                            </li>
                        </ul>
                    </button>
                );
            })}
        </div>
    );
}

function StripePaymentSection({ form, selectedPriceLabel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [stripeReady, setStripeReady] = useState(false);
    const [stripeError, setStripeError] = useState(null);

    const { data, processing, reset } = form;

    const submit = async (e) => {
        e.preventDefault();
        setStripeError(null);

        if (!stripe || !elements) {
            setStripeError('Stripe no está listo. Intenta de nuevo.');
            return;
        }

        const card = elements.getElement(CardElement);
        if (!card) {
            setStripeError('No se encontró el campo de tarjeta.');
            return;
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card,
            billing_details: {
                name: data.name,
                email: data.email,
            },
        });

        if (error) {
            setStripeError(error.message ?? 'No se pudo validar la tarjeta.');
            return;
        }

        form.transform((d) => ({
            ...d,
            payment_method: paymentMethod.id,
        }));
        form.post(route('register'), {
            onFinish: () => {
                form.reset('password', 'password_confirmation');
                form.transform((d) => d);
            },
        });
    };

    const disabled =
        processing ||
        !data.plan_id ||
        !stripeReady ||
        !data.privacy_notice_accepted;

    return (
        <>
            <div className="space-y-2">
                <Label>Tarjeta (Stripe)</Label>
                <div className="rounded-xl border border-input bg-background px-3 py-3">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: 'hsl(var(--foreground))',
                                    '::placeholder': { color: 'hsl(var(--muted-foreground))' },
                                },
                                invalid: { color: 'hsl(var(--destructive))' },
                            },
                        }}
                        onReady={() => setStripeReady(true)}
                    />
                </div>
                {stripeError ? (
                    <p className="text-sm text-destructive" role="alert">
                        {stripeError}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    size="lg"
                    disabled={disabled}
                    className="w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
                    onClick={submit}
                >
                    {processing ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Procesando…
                        </span>
                    ) : (
                        'Crear cuenta y empezar prueba gratis'
                    )}
                </Button>
            </div>

            <LegalFootnote selectedPriceLabel={selectedPriceLabel} />
        </>
    );
}

function PlainSubmitSection({ form, selectedPriceLabel }) {
    const { data, processing } = form;

    return (
        <>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                    type="submit"
                    size="lg"
                    disabled={processing || !data.privacy_notice_accepted}
                    className="w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
                >
                    {processing ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Procesando…
                        </span>
                    ) : (
                        'Crear cuenta y empezar prueba gratis'
                    )}
                </Button>
            </div>
            <LegalFootnote selectedPriceLabel={selectedPriceLabel} />
        </>
    );
}

function LegalFootnote({ selectedPriceLabel }) {
    return (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Al registrarte aceptas 7 días de prueba gratuita. Se realizará un cargo de{' '}
            {selectedPriceLabel}/mes al finalizar. Cancela cuando quieras.
        </p>
    );
}

export default function Register() {
    const { plans = [] } = usePage().props;
    const stripeKey = import.meta.env.VITE_STRIPE_KEY;
    const stripePromise = useMemo(() => {
        if (typeof stripeKey === 'string' && stripeKey !== '') {
            return loadStripe(stripeKey);
        }
        return null;
    }, [stripeKey]);

    const form = useForm({
        name: '',
        business_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        plan_id: '',
        payment_method: '',
        privacy_notice_accepted: false,
    });

    const { data, setData, errors } = form;

    const selectedPlan = plans.find(
        (p) => p.id === data.plan_id || p.id === Number(data.plan_id),
    );
    const selectedPriceLabel = selectedPlan
        ? new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
          }).format(selectedPlan.price_mxn)
        : '—';

    return (
        <GuestLayout
            headline="Crea tu cuenta de demo"
            subline="Registra tu negocio y tu usuario principal para probar ventas, caja e inventario."
        >
            <Head title="Registro" />

            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <Button variant="link" asChild className={cn('h-auto p-0 text-sm', linkPrimary)}>
                        <Link href={route('login')}>Iniciar sesión</Link>
                    </Button>
                </p>
            </div>

            <div className="mb-6 space-y-5">
                <AuthGoogleButton />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide">
                        <span className="bg-card px-3 text-muted-foreground">
                            O registro con correo
                        </span>
                    </div>
                </div>
            </div>

            <Separator className="mb-8" />

            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Elige un plan</h2>
                    <p className="text-sm text-muted-foreground">
                        Prueba 7 días gratis; luego se factura el plan elegido.
                    </p>
                </div>
                <PlanGrid
                    plans={plans}
                    selectedId={data.plan_id}
                    onSelect={(id) => setData('plan_id', id)}
                />
            </div>

            <Separator className="my-8" />

            <form
                className="space-y-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!stripePromise) {
                        form.post(route('register'), {
                            onFinish: () =>
                                form.reset('password', 'password_confirmation'),
                        });
                    }
                }}
            >
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre del propietario</Label>
                    <Input
                        id="name"
                        name="name"
                        value={data.name}
                        className={inputAuth}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="business_name">Nombre del negocio</Label>
                    <Input
                        id="business_name"
                        name="business_name"
                        value={data.business_name}
                        className={inputAuth}
                        autoComplete="organization"
                        onChange={(e) => setData('business_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.business_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="main_branch_name">Nombre de sucursal principal (opcional)</Label>
                    <Input
                        id="main_branch_name"
                        name="main_branch_name"
                        value={data.main_branch_name}
                        className={inputAuth}
                        placeholder="Sucursal Matriz"
                        onChange={(e) => setData('main_branch_name', e.target.value)}
                    />
                    <InputError message={errors.main_branch_name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={inputAuth}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className={inputAuth}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className={inputAuth}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <Card className="border-border bg-muted/40 shadow-none dark:bg-muted/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="privacy_notice_accepted"
                                checked={data.privacy_notice_accepted}
                                onCheckedChange={(v) =>
                                    setData('privacy_notice_accepted', v === true)
                                }
                                className="mt-1 shrink-0"
                            />
                            <Label
                                htmlFor="privacy_notice_accepted"
                                className="block min-w-0 flex-1 cursor-pointer text-sm font-normal leading-relaxed text-foreground"
                            >
                                <span className="inline">
                                    He leído y acepto el{' '}
                                    <Link
                                        href={route('legal.privacy')}
                                        className="font-semibold text-primary underline-offset-2 hover:underline"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        aviso de privacidad
                                    </Link>{' '}
                                    y los{' '}
                                    <Link
                                        href={route('legal.terms')}
                                        className="font-semibold text-primary underline-offset-2 hover:underline"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        términos del servicio
                                    </Link>
                                    .
                                </span>
                            </Label>
                        </div>
                        <InputError message={errors.privacy_notice_accepted} className="mt-3" />
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                {stripePromise ? (
                    <Elements stripe={stripePromise}>
                        <StripePaymentSection form={form} selectedPriceLabel={selectedPriceLabel} />
                    </Elements>
                ) : (
                    <PlainSubmitSection form={form} selectedPriceLabel={selectedPriceLabel} />
                )}

                <InputError message={errors.plan_id} className="mt-2" />
                <InputError message={errors.payment_method} className="mt-2" />
            </form>
        </GuestLayout>
    );
}
