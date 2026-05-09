/**
 * Agente local: ESC/POS por puerto serie (típico USB→COM en Windows).
 *
 * Modos:
 *   node index.js              → vigila PRINT_WATCH_DIR (por defecto storage/app/print-outbox del proyecto)
 *   node index.js --http       → POST /print (mismo JSON que Laravel) + Bearer opcional
 *
 * Variables: SERIAL_PORT (ej. COM3), SERIAL_BAUD (9600), PRINT_AGENT_SECRET, HTTP_PORT (9911)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const express = require('express');
const { SerialPort } = require('serialport');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_WATCH = path.join(ROOT, 'storage', 'app', 'print-outbox');

function stripAccents(s) {
    return String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function moneyMx(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return '-';
    return x.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
}

function buildEscPos(payload) {
    const chunks = [];
    const pushLatin = (text) => chunks.push(Buffer.from(stripAccents(text), 'latin1'));

    chunks.push(Buffer.from([0x1b, 0x40]));
    chunks.push(Buffer.from([0x1b, 0x74, 16]));
    chunks.push(Buffer.from([0x1b, 0x61, 0x01]));
    pushLatin(`Ticket #${payload.sale_id}\n`);
    chunks.push(Buffer.from([0x1b, 0x61, 0x00]));

    pushLatin(`Estado: ${payload.status} | Pago: ${payload.payment_status}\n`);
    pushLatin('--------------------------------\n');

    for (const line of payload.items || []) {
        const qty = Number(line.quantity);
        const name = stripAccents(String(line.name || '')).slice(0, 36);
        pushLatin(`${qty} x ${name}\n`);
        pushLatin(`   ${stripAccents(String(line.sku || ''))}  ${moneyMx(line.line_total)}\n`);
    }

    pushLatin('--------------------------------\n');
    pushLatin(`TOTAL ${moneyMx(payload.total)}\n\n`);
    pushLatin(`Job ${payload.print_job_id} @ ${payload.queued_at || ''}\n`);
    chunks.push(Buffer.from([0x1b, 0x64, 0x03]));
    chunks.push(Buffer.from([0x1d, 0x56, 0x00]));

    return Buffer.concat(chunks);
}

async function sendToPrinter(buffer) {
    const portPath = process.env.SERIAL_PORT || 'COM1';
    const baudRate = parseInt(process.env.SERIAL_BAUD || '9600', 10);

    const port = new SerialPort({
        path: portPath,
        baudRate,
        autoOpen: false,
    });

    await new Promise((resolve, reject) => {
        port.open((err) => (err ? reject(err) : resolve()));
    });

    await new Promise((resolve, reject) => {
        port.write(buffer, (err) => (err ? reject(err) : resolve()));
    });

    await new Promise((resolve) => {
        port.drain(() => resolve());
    });

    await new Promise((resolve, reject) => {
        port.close((err) => (err ? reject(err) : resolve()));
    });
}

async function printPayload(payload) {
    const buf = buildEscPos(payload);
    await sendToPrinter(buf);
}

async function processJsonFile(filePath) {
    const raw = await fs.readFile(filePath, 'utf8');
    const payload = JSON.parse(raw);
    await printPayload(payload);
    const done = `${filePath}.done`;
    try {
        await fs.rename(filePath, done);
    } catch {
        await fs.unlink(filePath).catch(() => {});
    }
}

function startWatcher() {
    const dir = process.env.PRINT_WATCH_DIR || DEFAULT_WATCH;
    if (!fsSync.existsSync(dir)) {
        console.error(`No existe la carpeta: ${dir}`);
        process.exit(1);
    }

    console.log(`Observando: ${dir}`);
    console.log(`Puerto serie: ${process.env.SERIAL_PORT || 'COM1'} @ ${process.env.SERIAL_BAUD || '9600'}`);

    const watcher = chokidar.watch(path.join(dir, '*.json'), {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });

    watcher.on('add', async (p) => {
        if (p.endsWith('.done')) return;
        try {
            console.log(`Imprimiendo: ${path.basename(p)}`);
            await processJsonFile(p);
            console.log('OK');
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
}

function startHttpServer() {
    const secret = process.env.PRINT_AGENT_SECRET || '';
    const port = parseInt(process.env.HTTP_PORT || '9911', 10);

    const app = express();
    app.use(express.json({ limit: '512kb' }));

    app.post('/print', async (req, res) => {
        if (secret) {
            const auth = req.headers.authorization || '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
            if (token !== secret) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        try {
            await printPayload(req.body);
            return res.json({ ok: true });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    });

    app.get('/health', (_req, res) => res.json({ ok: true }));

    app.listen(port, '127.0.0.1', () => {
        console.log(`Agente HTTP http://127.0.0.1:${port}/print (health /health)`);
        console.log(`Puerto serie: ${process.env.SERIAL_PORT || 'COM1'} @ ${process.env.SERIAL_BAUD || '9600'}`);
    });
}

if (process.argv.includes('--http')) {
    startHttpServer();
} else {
    startWatcher();
}
