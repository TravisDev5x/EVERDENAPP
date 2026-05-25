import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { usePage } from '@inertiajs/react';
import { Bell, BellOff } from 'lucide-react';

function formatRelativeTime(iso) {
    if (!iso) {
        return '';
    }
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 60_000) {
        return 'Ahora';
    }
    if (diffMs < 3_600_000) {
        return `${Math.floor(diffMs / 60_000)} min`;
    }
    if (diffMs < 86_400_000) {
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function badgeLabel(count) {
    if (count > 99) {
        return '99+';
    }
    return String(count);
}

export default function NotificationBell() {
    const { props } = usePage();
    const notifications = props.notifications ?? [];
    const unreadCount = props.unread_notifications_count ?? 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                            {badgeLabel(unreadCount)}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl">
                <div className="flex items-center justify-between border-b border-border/60 p-4">
                    <h4 className="text-sm font-semibold">Notificaciones</h4>
                    {unreadCount > 0 ? (
                        <Button variant="ghost" size="xs" className="h-auto px-2 text-xs text-primary">
                            Marcar leídas
                        </Button>
                    ) : null}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-[280px] flex-col items-center justify-center p-4 text-center">
                            <BellOff className="mb-2 h-8 w-8 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Sin notificaciones pendientes</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => {
                                const title =
                                    notification.data?.message ?? 'Notificación';
                                const isUnread = !notification.read_at;

                                return (
                                    <div
                                        key={notification.id}
                                        className={
                                            isUnread
                                                ? 'border-b border-border/40 border-l-2 border-l-primary bg-muted/10 p-3'
                                                : 'border-b border-border/40 p-3'
                                        }
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="shrink-0 text-[10px] text-muted-foreground">
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs text-foreground/90">
                                            {title}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
