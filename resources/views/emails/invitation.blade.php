<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Invitación</title></head>
<body style="font-family:sans-serif;max-width:600px;
             margin:0 auto;padding:20px;color:#1a1a1a;">
    <h1>Te invitaron a {{ $tenantName }}</h1>
    <p><strong>{{ $invitedByName }}</strong> te invitó a unirte
    a <strong>{{ $tenantName }}</strong> en Aberden como
    <strong>{{ $roleName }}</strong>.</p>
    <p style="margin:32px 0;">
        <a href="{{ $acceptUrl }}"
           style="background:#000;color:#fff;padding:12px 24px;
                  border-radius:8px;text-decoration:none;
                  font-weight:bold;">
            Aceptar invitación
        </a>
    </p>
    <p style="color:#666;font-size:13px;">
        Este enlace expira en 72 horas.<br>
        Si no esperabas esta invitación, ignora este mensaje.
    </p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;">
    <p style="color:#999;font-size:11px;">
        Aberden · Punto de venta para comercios en México
    </p>
</body>
</html>
