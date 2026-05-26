import { usePhoneMode } from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

export default function PosTopbar({ branches, activeBranchId, onChangeBranch, cashSession }) {
    const isPhoneMode = usePhoneMode();
    const registerName = cashSession?.cash_register?.name ?? 'Caja';

    return (
        <div className="safe-px flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background sm:gap-3">
            <select
                aria-label="Tienda activa"
                className="h-8 min-w-0 max-w-[min(100%,14rem)] flex-1 truncate rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 sm:max-w-xs sm:flex-none"
                value={activeBranchId}
                onChange={onChangeBranch}
            >
                {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.city ? ` - ${branch.city}` : ''}
                        {branch.is_main ? ' (Matriz)' : ''}
                    </option>
                ))}
            </select>
            <div
                className={cn(!isPhoneMode && 'hidden min-w-2 flex-1 sm:block')}
                aria-hidden
            />
            {cashSession ? (
                <Badge
                    variant="secondary"
                    className={cn(
                        'shrink-0 gap-1.5 truncate',
                        isPhoneMode ? 'max-w-[9rem]' : 'max-w-[11rem] sm:max-w-none',
                    )}
                >
                    <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    Turno #{cashSession.id} · {registerName}
                </Badge>
            ) : (
                <Badge variant="destructive">Caja cerrada</Badge>
            )}
        </div>
    );
}
