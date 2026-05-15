import { Badge } from '@/Components/ui/badge';

export default function PosTopbar({ branches, activeBranchId, onChangeBranch, cashSession }) {
    const registerName = cashSession?.cash_register?.name ?? 'Caja';

    return (
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
            <select
                aria-label="Tienda activa"
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-xs focus:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
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
            <div className="flex-1" />
            {cashSession ? (
                <Badge variant="secondary" className="gap-1.5">
                    <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    Turno #{cashSession.id} · {registerName}
                </Badge>
            ) : (
                <Badge variant="destructive">Caja cerrada</Badge>
            )}
        </div>
    );
}
