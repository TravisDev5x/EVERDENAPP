import CategoryManager from '@/Components/CategoryManager';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function ProductCategoriesIndex({ categories, canManage }) {
    const handleMutate = () => {
        router.reload({ only: ['categories'] });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                    Categorías de productos
                </h2>
            }
        >
            <Head title="Categorías" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                        <p className="mb-4 text-sm text-muted-foreground">
                            Organiza tu catálogo en categorías. Los productos sin categoría
                            seguirán funcionando normalmente.
                        </p>
                        <CategoryManager
                            categories={categories}
                            canManage={canManage}
                            onMutate={handleMutate}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
