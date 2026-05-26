import { FormFieldError } from '@/Components/FormField';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { InfoIcon } from 'lucide-react';

export default function PinConfig({ pin_required_actions = [], available_actions = {} }) {
    const { data, setData, patch, errors, processing } = useForm({
        pin_required_actions: pin_required_actions ?? [],
    });

    const toggleAction = (key) => {
        const current = data.pin_required_actions;
        if (current.includes(key)) {
            setData(
                'pin_required_actions',
                current.filter((item) => item !== key),
            );
        } else {
            setData('pin_required_actions', [...current, key]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('tenant.pin.config.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Configuración de PIN
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Selecciona las acciones que requerirán confirmación con PIN de 4 dígitos.
                    </p>
                </div>
            }
        >
            <Head title="Configuración de PIN" />

            <div className="py-8">
                <form
                    onSubmit={submit}
                    className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones protegidas</CardTitle>
                            <CardDescription>
                                Marca las operaciones sensibles que exigirán PIN de caja.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(available_actions).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <Checkbox
                                        id={`pin-action-${key}`}
                                        checked={data.pin_required_actions.includes(key)}
                                        onCheckedChange={() => toggleAction(key)}
                                    />
                                    <Label
                                        htmlFor={`pin-action-${key}`}
                                        className="cursor-pointer font-normal"
                                    >
                                        {label}
                                    </Label>
                                </div>
                            ))}
                            <FormFieldError message={errors.pin_required_actions} />
                        </CardContent>
                    </Card>

                    <Alert>
                        <InfoIcon />
                        <AlertTitle>Importante</AlertTitle>
                        <AlertDescription>
                            Los usuarios que no tengan PIN configurado no podrán realizar estas
                            acciones.
                        </AlertDescription>
                    </Alert>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? 'Guardando…' : 'Guardar configuración'}
                    </Button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
