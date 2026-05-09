import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const COLOR_PRESETS = [
    '#185FA5', '#3B6D11', '#BA7517', '#791F1F',
    '#5B21B6', '#0E7490', '#BE185D', '#374151',
];

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function CategoryManager({ categories, canManage, onMutate, compact = false }) {
    const [editingId, setEditingId] = useState(null);

    const form = useForm({
        name: '',
        slug: '',
        description: '',
        color: COLOR_PRESETS[0],
        sort_order: 0,
        is_active: true,
    });

    const isEditing = editingId !== null;

    const resetForm = () => {
        form.reset();
        form.setData('color', COLOR_PRESETS[0]);
        setEditingId(null);
        form.clearErrors();
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        form.setData({
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            color: category.color ?? COLOR_PRESETS[0],
            sort_order: category.sort_order ?? 0,
            is_active: category.is_active,
        });
        form.clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const onSuccess = () => {
            resetForm();
            onMutate?.();
        };

        if (isEditing) {
            form.patch(route('product-categories.update', editingId), {
                preserveScroll: true,
                onSuccess,
            });
        } else {
            form.post(route('product-categories.store'), {
                preserveScroll: true,
                onSuccess,
            });
        }
    };

    const handleDelete = (category) => {
        if (! confirm(`¿Eliminar la categoría "${category.name}"? Los productos asignados quedarán sin categoría.`)) {
            return;
        }

        router.delete(route('product-categories.destroy', category.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (editingId === category.id) {
                    resetForm();
                }
                onMutate?.();
            },
        });
    };

    return (
        <div className={cn('flex flex-col gap-4', compact ? '' : 'lg:grid lg:grid-cols-[1fr_320px] lg:gap-6')}>
            {/* Lista de categorías */}
            <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Categorías ({categories.length})
                </p>

                {categories.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Todavía no hay categorías. Crea la primera desde el formulario.
                    </p>
                ) : (
                    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={cn(
                                    'flex items-center gap-3 p-3 transition-colors hover:bg-muted/30',
                                    editingId === cat.id && 'bg-muted/50',
                                )}
                            >
                                <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: cat.color ?? '#94a3b8' }}
                                    aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {cat.name}
                                        {! cat.is_active && (
                                            <Badge variant="outline" className="ml-2 text-[10px]">
                                                Inactiva
                                            </Badge>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {cat.slug} · {cat.products_count ?? 0} producto{(cat.products_count ?? 0) === 1 ? '' : 's'}
                                    </p>
                                </div>
                                {canManage && (
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => startEdit(cat)}
                                            aria-label={`Editar ${cat.name}`}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(cat)}
                                            aria-label={`Eliminar ${cat.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario */}
            {canManage && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
                        </p>
                        {isEditing && (
                            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                                <X className="size-3" /> Cancelar
                            </Button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
                        <div>
                            <InputLabel htmlFor="cat-name" value="Nombre" />
                            <TextInput
                                id="cat-name"
                                className="mt-1 block w-full"
                                value={form.data.name}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    form.setData('name', v);
                                    if (! isEditing && ! form.data.slug) {
                                        form.setData('slug', slugify(v));
                                    }
                                }}
                                required
                            />
                            <InputError className="mt-1" message={form.errors.name} />
                        </div>

                        <div>
                            <InputLabel htmlFor="cat-slug" value="Slug" />
                            <TextInput
                                id="cat-slug"
                                className="mt-1 block w-full font-mono text-xs"
                                value={form.data.slug}
                                onChange={(e) => form.setData('slug', slugify(e.target.value))}
                                required
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Identificador único — solo minúsculas, números y guiones.
                            </p>
                            <InputError className="mt-1" message={form.errors.slug} />
                        </div>

                        <div>
                            <InputLabel value="Color" />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={cn(
                                            'size-8 rounded-full border-2 transition-all',
                                            form.data.color === color
                                                ? 'border-foreground scale-110'
                                                : 'border-transparent hover:scale-105',
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => form.setData('color', color)}
                                        aria-label={`Color ${color}`}
                                    />
                                ))}
                            </div>
                            <InputError className="mt-1" message={form.errors.color} />
                        </div>

                        <div>
                            <InputLabel htmlFor="cat-description" value="Descripción (opcional)" />
                            <TextInput
                                id="cat-description"
                                className="mt-1 block w-full"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.description} />
                        </div>

                        <div>
                            <InputLabel htmlFor="cat-sort" value="Orden" />
                            <TextInput
                                id="cat-sort"
                                type="number"
                                min="0"
                                className="mt-1 block w-full"
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Menor número aparece primero.
                            </p>
                            <InputError className="mt-1" message={form.errors.sort_order} />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                className="rounded border-border"
                            />
                            <span>Activa</span>
                        </label>

                        <Separator />

                        <Button type="submit" disabled={form.processing}>
                            {isEditing ? 'Actualizar' : <><Plus className="size-4" /> Crear categoría</>}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
