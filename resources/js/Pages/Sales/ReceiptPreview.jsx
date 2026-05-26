import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EvReceiptTemplate from '@/Components/EvReceiptTemplate';
import { Button } from '@/Components/ui/button';
import { Head, Link } from '@inertiajs/react';

export default function ReceiptPreview({ receipt, thermalUrl }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Ticket digital
                </h2>
            }
        >
            <Head title={`Ticket digital #${receipt?.folio ?? ''}`} />

            <div className="py-8">
                <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Vista previa con identidad Verde Bosque para envio digital o respaldo del cliente.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {thermalUrl ? (
                                <Link
                                    href={thermalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    Ver version termica
                                </Link>
                            ) : null}
                            <Button type="button" variant="outline" onClick={() => window.print()}>
                                Imprimir / Guardar PDF
                            </Button>
                        </div>
                    </div>

                    <EvReceiptTemplate receipt={receipt} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
