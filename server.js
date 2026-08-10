const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000;

const https = require('https');

// Token de Telegram del bot configurado
const TELEGRAM_TOKEN = '8400112371:AAFYYJ8QASXAwMRByi1LT1F64gRJzxQcT6c';

// Credenciales de PayPal Sandbox (Cargadas desde el código suministrado)
const PAYPAL_CLIENT_ID = "AfHEeYrd0s0yHCveJotF7UNJlM7uj2pQyZcj7tZb422pZoKIHb4KuV0mToUG8e1GWmNN49C4k7VVzHGK";
const PAYPAL_SECRET = "ENHbrf42RGUxpFaU9Id62cGBeypQOb2keOl6e800GVomHkoCiSk-nnQi1QQpPphmlu6uYfNv-lEeNfWK";

// 1. Obtener Token de Acceso OAuth2 desde PayPal Sandbox
function getPayPalAccessToken() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
        const data = 'grant_type=client_credentials';

        const options = {
            hostname: 'api-m.sandbox.paypal.com',
            port: 443,
            path: '/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode === 200 && parsed.access_token) {
                        resolve(parsed.access_token);
                    } else {
                        reject(new Error(`Error de autenticación con PayPal: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
    });
}

// 2. Crear una orden de pago en PayPal
function createPayPalOrder(token, amount, returnUrl, cancelUrl) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: amount
                    }
                }
            ],
            application_context: {
                return_url: returnUrl,
                cancel_url: cancelUrl,
                user_action: 'PAY_NOW',
                brand_name: 'Gupi Palace & Resort'
            }
        });

        const options = {
            hostname: 'api-m.sandbox.paypal.com',
            port: 443,
            path: '/v2/checkout/orders',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode === 201) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Error al crear la orden en PayPal: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(payload);
        req.end();
    });
}

// 3. Capturar el pago de una orden aprobada
function capturePayPalOrder(token, orderId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api-m.sandbox.paypal.com',
            port: 443,
            path: `/v2/checkout/orders/${orderId}/capture`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Error al capturar pago de orden ${orderId}: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));


// Helper para enviar notificación de Telegram desde el backend
async function sendTelegramNotification(booking, chatId) {
    if (!chatId || chatId === 'YOUR_CHAT_ID' || chatId === '8437684215' === false && !/^\d+$/.test(chatId)) {
        console.log('Notificación de Telegram omitida: Chat ID no configurado o inválido:', chatId);
        return;
    }

    const message = `🔔 *Nueva Reservación Guardada en BD* 🔔\n\n` +
        `*Código:* \`${booking.code}\`\n` +
        `*Huésped:* ${booking.guestName}\n` +
        `*Correo:* ${booking.guestEmail}\n` +
        `*Teléfono:* ${booking.guestPhone}\n` +
        `*Habitación:* ${booking.roomName}\n` +
        `*Fechas:* ${booking.checkin} al ${booking.checkout} (${booking.nights} ${booking.nights === 1 ? 'noche' : 'noches'})\n` +
        `*Adicionales:* ${booking.addons}\n` +
        `*Peticiones Especiales:* ${booking.guestRequests || 'Ninguna'}\n\n` +
        `*ESTADO:* _${booking.status}_\n` +
        `*TOTAL ESTIMADO:* ${booking.total}`;

    try {
        // Usar fetch dinámico o una petición HTTPS nativa para no requerir node-fetch
        const https = require('https');
        const payload = JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('Respuesta de Telegram recibida:', data);
            });
        });

        req.on('error', (error) => {
            console.error('Error al enviar mensaje a Telegram:', error);
        });

        req.write(payload);
        req.end();
    } catch (e) {
        console.error('Excepción al enviar notificación de Telegram:', e);
    }
}

// --- RUTAS DE LA API ---

// 1. Obtener todas las reservaciones
app.get('/api/bookings', (req, res) => {
    try {
        const bookings = db.getAll();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las reservaciones: ' + error.message });
    }
});

// 2. Obtener una reservación por código
app.get('/api/bookings/:code', (req, res) => {
    try {
        const booking = db.getById(req.params.code.toUpperCase());
        if (!booking) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la reservación: ' + error.message });
    }
});

// 3. Crear una nueva reservación
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        const newBooking = db.create(bookingData);
        
        // Si se envió un chat ID de telegram en la petición, mandamos la notificación
        if (bookingData.telegramChatId) {
            await sendTelegramNotification(newBooking, bookingData.telegramChatId);
        }
        
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la reservación: ' + error.message });
    }
});

// 4. Actualizar una reservación
app.put('/api/bookings/:code', (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const updateData = req.body;
        const updatedBooking = db.update(code, updateData);
        
        if (!updatedBooking) {
            return res.status(404).json({ error: 'Reservación no encontrada para actualizar' });
        }
        
        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la reservación: ' + error.message });
    }
});

// 5. Eliminar una reservación
app.delete('/api/bookings/:code', (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const success = db.remove(code);
        
        if (!success) {
            return res.status(404).json({ error: 'Reservación no encontrada para eliminar' });
        }
        
        res.json({ message: `Reservación ${code} eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la reservación: ' + error.message });
    }
});

// --- RUTAS DE PAYPAL ---

// 1. Crear Orden de Pago en PayPal y registrar reserva "Pendiente"
app.post('/api/paypal/create-order', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Registrar reserva en la base de datos como "Pendiente"
        const pendingBooking = {
            ...bookingData,
            status: 'Pendiente',
            paypalOrderId: ''
        };
        const newBooking = db.create(pendingBooking);

        // Limpiar el total para enviarlo a PayPal (ej: "$1,856" -> "1856.00")
        const cleanAmount = parseFloat(bookingData.total.replace(/[$,]/g, '')).toFixed(2);

        // URLs de retorno para el flujo del cliente
        const origin = req.headers.origin || 'http://localhost:5173';
        const returnUrl = `${origin}/?paypal_success=true&booking_code=${newBooking.code}`;
        const cancelUrl = `${origin}/#booking`;

        // Obtener el token de acceso de PayPal
        const token = await getPayPalAccessToken();

        // Crear la orden en la API de PayPal
        const orderData = await createPayPalOrder(token, cleanAmount, returnUrl, cancelUrl);

        // Guardar el PayPal Order ID en la reserva en la base de datos
        db.update(newBooking.code, { paypalOrderId: orderData.id });

        // Buscar el link de aprobación para redirigir al usuario
        let approveUrl = '';
        for (const link of orderData.links) {
            if (link.rel === 'approve') {
                approveUrl = link.href;
                break;
            }
        }

        res.json({
            success: true,
            bookingCode: newBooking.code,
            orderId: orderData.id,
            approveUrl: approveUrl
        });

    } catch (error) {
        console.error('Error al crear orden de PayPal:', error);
        res.status(500).json({ error: 'Error al procesar el pago: ' + error.message });
    }
});

// 2. Capturar el pago aprobado y confirmar la reserva
app.post('/api/paypal/capture-order', async (req, res) => {
    try {
        const { orderId, bookingCode } = req.body;
        
        if (!orderId || !bookingCode) {
            return res.status(400).json({ error: 'Se requiere orderId y bookingCode' });
        }

        // Obtener la reservación en base de datos
        const booking = db.getById(bookingCode);
        if (!booking) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }

        // Obtener token
        const token = await getPayPalAccessToken();

        // Capturar el pago con la orden
        const captureData = await capturePayPalOrder(token, orderId);

        if (captureData.status === 'COMPLETED') {
            // Actualizar la reserva a "Confirmada" en la base de datos
            const updatedBooking = db.update(bookingCode, { status: 'Confirmada' });

            // Enviar notificación a Telegram
            if (updatedBooking.telegramChatId) {
                await sendTelegramNotification(updatedBooking, updatedBooking.telegramChatId);
            }

            res.json({
                success: true,
                message: 'Pago capturado y reservación confirmada con éxito',
                booking: updatedBooking
            });
        } else {
            res.status(400).json({ 
                error: `El estado del pago de PayPal no es COMPLETED. Estado actual: ${captureData.status}` 
            });
        }

    } catch (error) {
        console.error('Error al capturar orden de PayPal:', error);
        res.status(500).json({ error: 'Error al capturar el pago: ' + error.message });
    }
});

// Servir el frontend para cualquier otra ruta no controlada por la API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});
