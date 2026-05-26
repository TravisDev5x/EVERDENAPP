import FormField from '@/Components/FormField';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-semibold text-foreground">
                    Eliminar cuenta
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Al eliminar tu cuenta se borrarán de forma permanente tus datos y recursos asociados. Descarga lo
                    que necesites conservar antes de continuar.
                </p>
            </header>

            <Button type="button" variant="destructive" onClick={confirmUserDeletion}>
                Eliminar cuenta
            </Button>

            <Dialog
                open={confirmingUserDeletion}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg" showCloseButton>
                    <form onSubmit={deleteUser}>
                        <DialogHeader>
                            <DialogTitle>
                                ¿Seguro que quieres eliminar tu cuenta?
                            </DialogTitle>
                            <DialogDescription>
                                Esta acción es permanente. Escribe tu contraseña para confirmar.
                            </DialogDescription>
                        </DialogHeader>

                        <FormField
                            id="password"
                            label="Contraseña"
                            labelClassName="sr-only"
                            error={errors.password}
                            className="py-4"
                        >
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="max-w-sm"
                                autoFocus
                                placeholder="Contraseña"
                            />
                        </FormField>

                        <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-end">
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                Eliminar cuenta
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
