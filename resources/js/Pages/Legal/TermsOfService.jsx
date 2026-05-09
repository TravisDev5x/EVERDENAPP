import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function TermsOfService({ organizationName, contactEmail }) {
    return (
        <GuestLayout>
            <Head title="Términos del servicio" />

            <div className="prose prose-sm max-w-none text-gray-800">
                <h1 className="text-lg font-semibold text-gray-900">Términos del servicio</h1>
                <p className="text-xs text-gray-500">
                    Prestador: <strong>{organizationName}</strong>. Contacto:{' '}
                    <a className="text-indigo-600" href={`mailto:${contactEmail}`}>
                        {contactEmail}
                    </a>
                </p>

                <h2 className="mt-4 text-base font-semibold">1. Objeto</h2>
                <p>
                    El software proporciona funcionalidades de punto de venta, inventario, caja y operación multitenant.
                    El uso debe ser lícito y conforme a este aviso y a la legislación aplicable.
                </p>

                <h2 className="mt-4 text-base font-semibold">2. Cuentas y seguridad</h2>
                <p>
                    El titular de la cuenta es responsable de credenciales y del cumplimiento dentro de su organización.
                    Debe notificar accesos no autorizados de forma inmediata al contacto indicado.
                </p>

                <h2 className="mt-4 text-base font-semibold">3. Disponibilidad y cambios</h2>
                <p>
                    Se procura la continuidad del servicio sin garantía absoluta. Las mejoras o cambios sustanciales
                    pueden comunicarse por los canales habituales del prestador.
                </p>

                <h2 className="mt-4 text-base font-semibold">4. Limitación</h2>
                <p>
                    En la medida permitida por la ley, la responsabilidad se limita al alcance del servicio contratado.
                    Los datos de negocio son responsabilidad del tenant correspondiente.
                </p>

                <p className="mt-6">
                    <Link href="/" className="text-sm text-indigo-600 underline">
                        Volver al inicio
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
