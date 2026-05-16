<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Textos en español para el correo de restablecimiento de contraseña.
 * El envío usa Illuminate\Auth\Notifications\ResetPassword (registrado en AppServiceProvider::boot).
 */
final class ResetPasswordNotification extends BaseResetPassword
{
    public static function mailMessage(string $url): MailMessage
    {
        $expire = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Restablecer contraseña')
            ->line('Recibiste este correo porque solicitaste restablecer la contraseña de tu cuenta.')
            ->action('Restablecer contraseña', $url)
            ->line("Este enlace expirará en {$expire} minutos.")
            ->line('Si no solicitaste restablecer tu contraseña, no es necesaria ninguna acción.');
    }

    /**
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        return self::mailMessage($url);
    }
}
