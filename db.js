const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'bookings.json');

// Asegura que el directorio data y el archivo bookings.json existan
function initDatabase() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
    }
}

// Leer todas las reservaciones
function getAll() {
    initDatabase();
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer la base de datos:', error);
        return [];
    }
}

// Guardar todas las reservaciones
function saveAll(bookings) {
    initDatabase();
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error al escribir en la base de datos:', error);
        return false;
    }
}

// Obtener una reservación por ID (código de reserva)
function getById(code) {
    const bookings = getAll();
    return bookings.find(b => b.code === code);
}

// Crear una nueva reservación
function create(bookingData) {
    const bookings = getAll();

    // Generar código único si no existe
    let code = bookingData.code;
    if (!code) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        do {
            code = 'GP-';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (bookings.some(b => b.code === code));
    }

    const newBooking = {
        code: code,
        guestName: bookingData.guestName || 'Invitado Sin Nombre',
        guestEmail: bookingData.guestEmail || '',
        guestPhone: bookingData.guestPhone || '',
        roomKey: bookingData.roomKey || 'ocean-deluxe',
        roomName: bookingData.roomName || 'Habitación Premium',
        checkin: bookingData.checkin || '',
        checkout: bookingData.checkout || '',
        nights: parseInt(bookingData.nights) || 1,
        addons: bookingData.addons || 'Ninguno',
        guestRequests: bookingData.guestRequests || '',
        total: bookingData.total || '$0',
        status: bookingData.status || 'Pendiente', // Pendiente, Confirmada, Cancelada
        paypalOrderId: bookingData.paypalOrderId || '',
        telegramChatId: bookingData.telegramChatId || '',
        createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveAll(bookings);
    return newBooking;
}

// Actualizar una reservación
function update(code, updateData) {
    const bookings = getAll();
    const index = bookings.findIndex(b => b.code === code);

    if (index === -1) {
        return null; // No encontrado
    }

    // Actualizamos campos permitidos
    const existing = bookings[index];
    const updated = {
        ...existing,
        guestName: updateData.guestName !== undefined ? updateData.guestName : existing.guestName,
        guestEmail: updateData.guestEmail !== undefined ? updateData.guestEmail : existing.guestEmail,
        guestPhone: updateData.guestPhone !== undefined ? updateData.guestPhone : existing.guestPhone,
        roomKey: updateData.roomKey !== undefined ? updateData.roomKey : existing.roomKey,
        roomName: updateData.roomName !== undefined ? updateData.roomName : existing.roomName,
        checkin: updateData.checkin !== undefined ? updateData.checkin : existing.checkin,
        checkout: updateData.checkout !== undefined ? updateData.checkout : existing.checkout,
        nights: updateData.nights !== undefined ? parseInt(updateData.nights) : existing.nights,
        addons: updateData.addons !== undefined ? updateData.addons : existing.addons,
        guestRequests: updateData.guestRequests !== undefined ? updateData.guestRequests : existing.guestRequests,
        total: updateData.total !== undefined ? updateData.total : existing.total,
        status: updateData.status !== undefined ? updateData.status : existing.status,
        paypalOrderId: updateData.paypalOrderId !== undefined ? updateData.paypalOrderId : existing.paypalOrderId,
        telegramChatId: updateData.telegramChatId !== undefined ? updateData.telegramChatId : existing.telegramChatId,
        updatedAt: new Date().toISOString()
    };

    bookings[index] = updated;
    saveAll(bookings);
    return updated;
}

// Eliminar una reservación
function remove(code) {
    const bookings = getAll();
    const filtered = bookings.filter(b => b.code !== code);
    
    if (bookings.length === filtered.length) {
        return false; // No se eliminó nada
    }

    saveAll(filtered);
    return true;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
