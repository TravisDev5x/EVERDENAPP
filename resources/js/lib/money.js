/**
 * Espejo determinista de App\Support\Money.php.
 * Trabaja en centavos enteros con redondeo half-up basado en la milesima
 * para garantizar paridad cliente / servidor (LFPC + offline-first).
 */

const NUMERIC_RE = /[^0-9.\-]/g;

function normalize(value) {
    if (value === null || value === undefined) return '0';
    let raw = String(value).replace(NUMERIC_RE, '');
    if (raw === '' || raw === '-') return '0';
    return raw;
}

export function decimalToCents(value) {
    let raw = normalize(value);
    const negative = raw.startsWith('-');
    if (negative) raw = raw.replace(/^-+/, '');

    const [wholeRaw, fractionRaw = '0'] = raw.split('.');
    const whole = parseInt(wholeRaw || '0', 10) || 0;

    const fractionPadded = (fractionRaw + '000').slice(0, 3);
    const cents = whole * 100 + parseInt(fractionPadded.slice(0, 2) || '0', 10);
    const third = parseInt(fractionPadded[2] || '0', 10);
    const adjusted = third >= 5 ? cents + 1 : cents;

    return negative ? -adjusted : adjusted;
}

export function centsToDecimal(cents) {
    const negative = cents < 0;
    const absCents = Math.abs(Math.trunc(cents));
    const whole = Math.floor(absCents / 100);
    const fraction = absCents % 100;
    const value = `${whole}.${String(fraction).padStart(2, '0')}`;
    return negative ? `-${value}` : value;
}

export function taxCents(baseCents, taxRate) {
    const rateBasisPoints = rateToBasisPoints(taxRate);
    const numerator = baseCents * rateBasisPoints;
    return Math.trunc((numerator + 5000) / 10000);
}

function rateToBasisPoints(rate) {
    let raw = normalize(rate);
    raw = raw.replace(/^-+/, '');
    const [wholeRaw, fractionRaw = '0'] = raw.split('.');
    const whole = parseInt(wholeRaw || '0', 10) || 0;
    const fraction = (fractionRaw + '00').slice(0, 2);
    return whole * 100 + (parseInt(fraction, 10) || 0);
}

const MXN_FORMATTER = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Formatea un decimal monetario en MXN respetando es-MX y dos decimales obligatorios.
 */
export function formatMxn(value) {
    const cents = decimalToCents(value);
    return MXN_FORMATTER.format(cents / 100);
}

/**
 * Suma una lista de decimales en centavos enteros y devuelve el decimal final
 * (cero drift respecto a SaleCalculator::recalculate del backend).
 */
export function sumDecimals(values) {
    let sum = 0;
    for (const value of values) sum += decimalToCents(value);
    return centsToDecimal(sum);
}
