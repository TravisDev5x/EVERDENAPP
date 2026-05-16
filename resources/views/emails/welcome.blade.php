<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a EVERDEN</title>
</head>
<body style="font-family: sans-serif; max-width: 600px;
             margin: 0 auto; padding: 20px; color: #1a1a1a;">

    <h1 style="font-size: 24px; font-weight: bold;">
        Bienvenido, {{ $user->name }} 👋
    </h1>

    <p>Tu negocio <strong>{{ $tenantName }}</strong> ya está
    registrado en EVERDEN.</p>

    <p>Tienes <strong>7 días de prueba gratuita</strong> para
    explorar el sistema de punto de venta.</p>

    <p>Inicia sesión con tu correo:
    <strong>{{ $user->email }}</strong></p>

    <hr style="border: none; border-top: 1px solid #e5e5e5;
               margin: 24px 0;">

    <p style="color: #666; font-size: 12px;">
        EVERDEN · Punto de venta para comercios en México<br>
        contacto@everden.mx
    </p>
</body>
</html>
