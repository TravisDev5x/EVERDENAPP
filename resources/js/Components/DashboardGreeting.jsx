import { useEffect, useState } from 'react';

function getSaludo() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) {
        return 'Buenos días';
    }
    if (h >= 12 && h < 19) {
        return 'Buenas tardes';
    }
    return 'Buenas noches';
}

function getInitials(name) {
    if (!name?.trim()) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/**
 * @param {{ user: { name?: string } | null, tenant?: { name?: string } | null }} props
 */
export default function DashboardGreeting({ user, tenant: _tenant }) {
    const [dateLabel, setDateLabel] = useState('');
    const [timeLabel, setTimeLabel] = useState('');
    const [saludo, setSaludo] = useState(getSaludo);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setSaludo(getSaludo());
            const raw = now.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            setDateLabel(raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase());
            setTimeLabel(
                now.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const displayName = user?.name ?? 'Usuario';

    return (
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                {getInitials(displayName)}
            </div>
            <div className="flex min-w-0 flex-col">
                <p className="text-lg font-semibold text-foreground">
                    {saludo}, {displayName}
                </p>
                <p className="text-sm text-muted-foreground">{dateLabel}</p>
                <p className="font-mono text-base font-medium tabular-nums text-muted-foreground">
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
