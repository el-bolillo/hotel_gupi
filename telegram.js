// Configuración del Bot de Telegram (@tortuga_2006_bot)
export const TELEGRAM_TOKEN = '8400112371:AAFYYJ8QASXAwMRByi1LT1F64gRJzxQcT6c';

// Obtener el ID de chat desde localStorage o usar el valor predeterminado
export function getTelegramChatId() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('telegram_chat_id')) {
        const newChatId = urlParams.get('telegram_chat_id');
        localStorage.setItem('telegram_chat_id', newChatId);
        console.log('Telegram Chat ID para @tortuga_2006_bot guardado en localStorage:', newChatId);
    }
    return localStorage.getItem('telegram_chat_id') || '8437684215';
}

// Enviar detalles de la reserva al chatbot de Telegram @tortuga_2006_bot
export function sendTelegramNotification(bookingData, chatId) {
    if (!chatId || chatId === 'YOUR_CHAT_ID') {
        console.warn('Telegram Notification: No se ha configurado el ID de chat para @tortuga_2006_bot. Configúralo en telegram.js, app.js o agrégalo a la URL (?telegram_chat_id=TU_ID) para recibir las alertas.');
        return;
    }

    const message = `🔔 *Nueva Reservación en Gupi Palace & Resort* 🔔\n\n` +
        `*Código:* \`${bookingData.code}\`\n` +
        `*Huésped:* ${bookingData.guestName}\n` +
        `*Correo:* ${bookingData.guestEmail}\n` +
        `*Teléfono:* ${bookingData.guestPhone}\n` +
        `*Habitación:* ${bookingData.roomName}\n` +
        `*Fechas:* ${bookingData.checkin} al ${bookingData.checkout} (${bookingData.nights} ${bookingData.nights === 1 ? 'noche' : 'noches'})\n` +
        `*Adicionales:* ${bookingData.addons}\n` +
        `*Peticiones Especiales:* ${bookingData.guestRequests || 'Ninguna'}\n\n` +
        `*TOTAL ESTIMADO:* ${bookingData.total}`;

    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta de Telegram: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Notificación de Telegram enviada con éxito:', data);
    })
    .catch(error => {
        console.error('Error al enviar la notificación de Telegram:', error);
    });
}
