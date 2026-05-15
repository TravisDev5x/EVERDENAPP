/**
 * Pantalla completa del documento (API estándar + prefijos legacy).
 * Solo actúa sobre document.documentElement por seguridad y consistencia.
 */

const FULLSCREEN_CHANGE_EVENTS = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
];

function getFullscreenElement() {
    if (typeof document === 'undefined') {
        return null;
    }
    return (
        document.fullscreenElement ??
        document.webkitFullscreenElement ??
        document.mozFullScreenElement ??
        document.msFullscreenElement ??
        null
    );
}

/**
 * @returns {boolean} Si el navegador expone requestFullscreen en el elemento raíz.
 */
export function isFullscreenSupported() {
    if (typeof document === 'undefined') {
        return false;
    }
    const el = document.documentElement;
    return Boolean(
        el.requestFullscreen ??
            el.webkitRequestFullscreen ??
            el.mozRequestFullScreen ??
            el.msRequestFullscreen,
    );
}

/** @returns {boolean} Si la app está en pantalla completa ahora mismo. */
export function isAppFullscreen() {
    return Boolean(getFullscreenElement());
}

/**
 * Entra en pantalla completa (debe invocarse desde un gesto del usuario, p. ej. clic).
 * @returns {Promise<boolean>} true si se activó; false si no hay soporte.
 */
export async function enterAppFullscreen() {
    if (!isFullscreenSupported()) {
        return false;
    }

    const el = document.documentElement;

    try {
        if (el.requestFullscreen) {
            await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
            await el.msRequestFullscreen();
        } else {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Sale de pantalla completa.
 * @returns {Promise<boolean>} true si se salió o ya no estaba activo.
 */
export async function exitAppFullscreen() {
    if (!isAppFullscreen()) {
        return true;
    }

    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
        } else {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Alterna pantalla completa del documento.
 * @returns {Promise<boolean>} true si quedó en pantalla completa tras la acción.
 */
export async function toggleAppFullscreen() {
    if (isAppFullscreen()) {
        await exitAppFullscreen();
        return isAppFullscreen();
    }
    await enterAppFullscreen();
    return isAppFullscreen();
}

/**
 * Suscribe a cambios de pantalla completa (Esc, F11 del SO, etc.).
 * @param {(active: boolean) => void} listener
 * @returns {() => void} función para cancelar la suscripción
 */
export function subscribeAppFullscreen(listener) {
    if (typeof document === 'undefined') {
        return () => {};
    }

    const onChange = () => {
        listener(isAppFullscreen());
    };

    for (const event of FULLSCREEN_CHANGE_EVENTS) {
        document.addEventListener(event, onChange);
    }

    return () => {
        for (const event of FULLSCREEN_CHANGE_EVENTS) {
            document.removeEventListener(event, onChange);
        }
    };
}
