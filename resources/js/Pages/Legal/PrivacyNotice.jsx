import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function PrivacyNotice({ contactEmail, organizationName, retentionDays }) {
    return (
        <GuestLayout>
            <Head title="Aviso de privacidad" />

            <div className="prose prose-sm max-w-none text-gray-800">
                <h1 className="text-lg font-semibold text-gray-900">Aviso de privacidad integral</h1>
                <p className="text-xs text-gray-500">
                    Responsable: <strong>{organizationName}</strong>. Contacto privacidad:{' '}
                    <a className="text-indigo-600" href={`mailto:${contactEmail}`}>
                        {contactEmail}
                    </a>
                </p>

                <h2 className="mt-4 text-base font-semibold">1. Finalidad</h2>
                <p>
                    Tratamos datos identificativos y de contacto de usuarios del sistema (por ejemplo nombre y
                    correo electrónico) para prestar el servicio de punto de venta multitenancy, autenticación,
                    auditoría operativa, soporte y cumplimiento de obligaciones legales aplicables.
                </p>

                <h2 className="mt-4 text-base font-semibold">2. Datos personales tratados</h2>
                <ul className="list-disc pl-5">
                    <li>Identificación y contacto del usuario (nombre, correo).</li>
                    <li>Datos operativos asociados al tenant (roles, sucursal activa, registros de auditoría).</li>
                    <li>
                        Datos técnicos necesarios para seguridad (por ejemplo identificadores de sesión, huellas de
                        auditoría; sin registrar contraseñas en claro).
                    </li>
                </ul>

                <h2 className="mt-4 text-base font-semibold">3. Base jurídica y conservación</h2>
                <p>
                    La relación contractual / prestación del servicio y, en su caso, consentimiento para comunicaciones
                    comerciales cuando aplique. Los datos se conservan el tiempo necesario para la finalidad y los
                    plazos legales. Referencias configurables en esta instalación (orientativas):
                </p>
                <ul className="list-disc pl-5 text-sm">
                    <li>
                        Logs / auditoría operativa: hasta{' '}
                        <strong>{retentionDays.audit_logs ?? '—'}</strong> días (según configuración del responsable).
                    </li>
                    <li>
                        Sesión inactiva (referencia de tiempo de vida de sesión):{' '}
                        <strong>{retentionDays.session_idle_timeout_minutes ?? '—'}</strong> minutos de inactividad.
                    </li>
                </ul>

                <h2 className="mt-4 text-base font-semibold">4. Medidas de seguridad (referencia ISO / LFPDPPP)</h2>
                <p>
                    Este sistema incorpora medidas técnicas y organizativas proporcionales: control de acceso por roles,
                    aislamiento por tenant, trazabilidad de operaciones sensibles, protección de sesión, cabeceras HTTP de
                    seguridad en producción, limitación de intentos en autenticación y orientación a cifrado en tránsito
                    (HTTPS). Estas medidas se alinean con buenas prácticas compatibles con marcos como ISO/IEC 27001 e
                    ISO/IEC 27701; la certificación formal depende de un SGSI y auditoría independiente.
                </p>

                <h2 className="mt-4 text-base font-semibold">5. Derechos ARCO y revocación</h2>
                <p>
                    Puede ejercer derechos de acceso, rectificación, cancelación, oposición, limitación u oposición al
                    tratamiento donde corresponda, ante el responsable en la dirección indicada. También puede revocar
                    consentimientos otorgados sin efectos retroactivos ilegales.
                </p>

                <h2 className="mt-4 text-base font-semibold">6. Transferencias y encargados</h2>
                <p>
                    No vendemos datos personales. Subprocesadores (por ejemplo hosting, correo, copias de seguridad)
                    deben formalizarse mediante contratos de tratamiento conforme a la ley aplicable. Lista actualizable
                    bajo solicitud al correo de contacto.
                </p>

                <p className="mt-6 text-xs text-gray-500">
                    Documento informativo. Para obligaciones específicas de tu sector o país, complementar con asesoría
                    legal.
                </p>

                <p className="mt-4">
                    <Link href="/" className="text-sm text-indigo-600 underline">
                        Volver al inicio
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
