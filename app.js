/* ==========================================================================
   APP FRONTEND LOGIC & INTERACTIVITY: GUPI PALACE & RESORT
   ========================================================================== */

import { getTelegramChatId, sendTelegramNotification } from './telegram.js';

// Room Database
const roomData = {
    'penthouse': {
        name: 'Grand Penthouse Imperial',
        category: 'Suite Exclusiva',
        price: 1200,
        image: 'assets/penthouse_suite.png',
        desc: 'Ubicada en el piso 60, nuestra suite insignia redefine el concepto de opulencia. Disfrute de 240 m² de puro diseño moderno con vistas panorámicas de 360 grados, piscina de inmersión climatizada en su terraza privada, piano de cola, cava de vinos personal, comedor formal para 8 personas y acceso privado directo mediante elevador express.',
        amenities: [
            'Piscina privada de borde infinito',
            'Mayordomo dedicado las 24 horas',
            'Acceso directo a helipuerto',
            'Terraza amueblada de 80 m²',
            'Bar privado de cortesía completo',
            'Desayuno Imperial diario incluido',
            'Baño principal de mármol de Carrara',
            'Acceso ilimitado a Aurum Spa VIP'
        ]
    },
    'ocean-deluxe': {
        name: 'Grand Deluxe Vista al Océano',
        category: 'Deluxe',
        price: 450,
        image: 'assets/infinity_pool.png',
        desc: 'Una experiencia residencial inigualable con vista frontal al mar. Diseñada en tonos arena y azul marino, cuenta con una cama de tamaño King vestida con sábanas de lino de 800 hilos, amplio balcón privado con camastros, tina de hidromasaje independiente, sistema de sonido envolvente de alta gama y amenidades de baño de diseñador.',
        amenities: [
            'Balcón privado frente al océano',
            'Tina de hidromasaje profunda',
            'Cafetera Espresso premium',
            'Smart TV de 65 pulgadas',
            'Servicio de cortesía nocturna',
            'Menú de almohadas personalizado',
            'Caja fuerte para laptop',
            'Amenidades de tocador Bulgari'
        ]
    },
    'underwater': {
        name: 'Suite Submarina Poseidón',
        category: 'Experiencia Única',
        price: 2500,
        image: 'assets/hotel_exterior.png',
        desc: 'Ubicada a 10 metros bajo el agua en nuestra laguna de arrecifes coralinos privados, esta suite ofrece una experiencia de ensueño inolvidable. Las paredes y el techo del dormitorio principal están compuestos por acrílico transparente de alta resistencia, brindándole vistas ininterrumpidas de mantarrayas, peces tropicales y vida marina exótica desde la comodidad de su cama.',
        amenities: [
            'Dormitorio acrílico submarino',
            'Observatorio privado 180°',
            'Chef privado a la carta para cena',
            'Servicios de buzo personal',
            'Acceso a playa VIP',
            'Sesión de fotos submarina',
            'Servicios de conserjería 24/7',
            'Traslado privado en helicóptero'
        ]
    },
    'garden-villa': {
        name: 'Villa Jardín & Oasis Privado',
        category: 'Deluxe',
        price: 350,
        image: 'assets/penthouse_suite.png',
        desc: 'Escondida en los exhuberantes jardines tropicales del resort, esta villa ofrece la máxima privacidad y tranquilidad. Dispone de un patio privado amurallado con jardín botánico, una regadera tipo lluvia al aire libre de estilo balinés, una alberca privada pequeña y una espaciosa sala de estar ideal para relajarse rodeado de naturaleza.',
        amenities: [
            'Alberca de inmersión en jardín',
            'Regadera al aire libre tipo lluvia',
            'Patio botánico privado de 50 m²',
            'Acceso directo a la piscina oasis',
            'Hamacas de diseñador',
            'Bicicletas de cortesía',
            'Bar de té orgánico en la habitación',
            'Acceso a clases de yoga matutinas'
        ]
    }
};

class HotelApp {
    constructor() {
        this.currentView = 'home';
        this.currentBookingStep = 1;
        this.selectedRoomKey = '';
        this.tmdbApiKey = "fbe53da092213a1991617b41b03f4f1c";

        // Obtener el ID de chat de Telegram de conexiones/telegram.js
        this.telegramChatId = getTelegramChatId();

        this.init();
    }

    init() {
        // Elements
        this.navbar = document.getElementById('main-navbar');
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.roomModal = document.getElementById('room-detail-modal');
        this.receiptModal = document.getElementById('booking-receipt-modal');
        this.adminModal = document.getElementById('admin-booking-modal');
        this.deleteModal = document.getElementById('admin-delete-modal');
        this.paypalLoadingModal = document.getElementById('paypal-loading-modal');
        this.movieCastModal = document.getElementById('movie-cast-modal');
        this.bookingForm = document.getElementById('hotel-booking-form');
        this.contactForm = document.getElementById('hotel-contact-form');
        this.adminBookingForm = document.getElementById('admin-booking-form');
        
        // Data in memory for admin dashboard
        this.adminBookings = [];

        // Date Inputs
        this.bookCheckin = document.getElementById('book-checkin');
        this.bookCheckout = document.getElementById('book-checkout');
        this.quickCheckin = document.getElementById('quick-checkin');
        this.quickCheckout = document.getElementById('quick-checkout');

        // Setup Event Listeners
        this.setupEventListeners();
        this.setupDatePickers();
        
        // Handle initial route based on hash
        this.handleRouting();

        // Verificar si regresamos de un pago exitoso de PayPal
        this.checkPayPalPaymentCallback();
    }

    setupEventListeners() {
        // Sticky Header scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        });

        // Hash Navigation
        window.addEventListener('hashchange', () => this.handleRouting());

        // Navigation click handlers (capturing both navbar and inline buttons)
        document.querySelectorAll('[data-view]').forEach(elem => {
            elem.addEventListener('click', (e) => {
                const targetView = elem.getAttribute('data-view');
                if (targetView) {
                    // Prevent default only if it's an anchor pointing to hash, 
                    // let hashchange handle it.
                    if (elem.tagName === 'A') {
                        e.preventDefault();
                        window.location.hash = targetView;
                    } else {
                        this.switchView(targetView);
                    }
                    this.closeMobileMenu();
                }
            });
        });

        // Mobile Menu toggle
        this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());

        // Room Card Filter Click handlers
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterRooms(filter, e.target);
            });
        });

        // Close modal on outside click
        [this.roomModal, this.receiptModal, this.adminModal, this.deleteModal, this.movieCastModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal();
                        this.closeReceiptModal();
                        this.closeAdminModal();
                        this.closeDeleteModal();
                        this.closeCastModal();
                    }
                });
            }
        });

        // ESC key modal closer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeReceiptModal();
                this.closeAdminModal();
                this.closeDeleteModal();
                this.closeCastModal();
            }
        });
    }

    setupDatePickers() {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = formatDate(today);
        const tomorrowStr = formatDate(tomorrow);

        // Set min and default values
        if (this.bookCheckin) {
            this.bookCheckin.min = todayStr;
            this.bookCheckin.value = todayStr;
        }
        if (this.bookCheckout) {
            this.bookCheckout.min = tomorrowStr;
            this.bookCheckout.value = tomorrowStr;
        }

        if (this.quickCheckin) {
            this.quickCheckin.min = todayStr;
            this.quickCheckin.value = todayStr;
        }
        if (this.quickCheckout) {
            this.quickCheckout.min = tomorrowStr;
            this.quickCheckout.value = tomorrowStr;
        }
    }

    // Routing System
    handleRouting() {
        let hash = window.location.hash.substring(1);
        const validViews = ['home', 'rooms', 'amenities', 'booking', 'contact', 'admin', 'entertainment'];
        
        if (!hash || !validViews.includes(hash)) {
            hash = 'home';
        }
        
        this.switchView(hash);
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show active view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // Update nav links active state
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkView = link.getAttribute('data-view');
            if (linkView === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Si es la vista de administración, cargamos los datos desde la BD
        if (viewName === 'admin') {
            this.fetchBookings();
        }

        // Si es la vista de entretenimiento, cargamos las películas populares de TMDB
        if (viewName === 'entertainment') {
            this.fetchMovies('popular');
        }

        // Scroll to top of window when view switches
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Mobile Navigation Controls
    toggleMobileMenu() {
        this.mobileToggle.classList.toggle('active');
        this.navMenu.classList.toggle('mobile-active');
    }

    closeMobileMenu() {
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('mobile-active');
    }

    // Rooms Filter Logic
    filterRooms(filter, activeBtn) {
        // Update active class on filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');

        // Filter cards
        const roomCards = document.querySelectorAll('.room-card');
        roomCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                card.style.display = 'flex';
                // Add quick animations trigger
                card.animate([
                    { opacity: 0, transform: 'scale(0.96)' },
                    { opacity: 1, transform: 'scale(1)' }
                ], { duration: 300, easing: 'ease-out' });
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Modals Controls
    openRoomDetail(roomKey) {
        const room = roomData[roomKey];
        if (!room) return;

        const modalBody = document.getElementById('modal-body-content');
        
        // Build dynamic lists of amenities
        let amenitiesHTML = '';
        room.amenities.forEach(amenity => {
            amenitiesHTML += `<li><i class="fa-solid fa-circle-check"></i> ${amenity}</li>`;
        });

        modalBody.innerHTML = `
            <div class="room-modal-grid">
                <div class="room-modal-image" style="background-image: url('${room.image}');"></div>
                <div class="room-modal-details">
                    <span class="room-category">${room.category}</span>
                    <h2>${room.name}</h2>
                    <p>${room.desc}</p>
                    
                    <h3 style="font-size: 1rem; margin-bottom:12px; color:var(--color-gold);">Servicios de cortesía incluidos:</h3>
                    <ul class="modal-amenities-list">
                        ${amenitiesHTML}
                    </ul>
                    
                    <div class="room-footer" style="margin-top:auto; padding-top:20px; border-top:1px solid var(--border-glass);">
                        <div class="room-price">
                            <span class="price-amount">$${room.price.toLocaleString('en-US')}</span>
                            <span class="price-unit">/ Noche</span>
                        </div>
                        <button class="btn btn-gold" onclick="app.selectRoomForBooking('${roomKey}'); app.closeModal();">Reservar Ahora</button>
                    </div>
                </div>
            </div>
        `;

        this.roomModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scrolling
    }

    closeModal() {
        this.roomModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Unlock scrolling
    }

    // Reservation Engine Logic
    selectRoomForBooking(roomKey) {
        const select = document.getElementById('book-room');
        if (select) {
            select.value = roomKey;
        }
        
        // If coming from quick-booking inputs
        this.syncQuickBookingDatesToBookingForm();

        // Redirect to booking view
        window.location.hash = 'booking';
        
        // Go back to first step in case they were on step 2 or 3
        this.goToStep(1);
        
        // Trigger summary recalculation
        this.updateBookingSummary();
    }

    syncQuickBookingDatesToBookingForm() {
        if (this.quickCheckin.value) {
            this.bookCheckin.value = this.quickCheckin.value;
        }
        if (this.quickCheckout.value) {
            this.bookCheckout.value = this.quickCheckout.value;
        }
        
        // Sync Guests selection
        const quickGuests = this.quickGuests.value;
        if (quickGuests && quickGuests !== 'luxury-group') {
            const guestSelect = document.getElementById('book-guests');
            if (guestSelect) guestSelect.value = quickGuests;
        }
    }

    handleQuickBook() {
        this.syncQuickBookingDatesToBookingForm();
        window.location.hash = 'booking';
        this.goToStep(1);
        this.updateBookingSummary();
    }

    // Step Switching
    goToStep(stepNum) {
        // Validate inputs before moving forward
        if (stepNum > this.currentBookingStep) {
            if (this.currentBookingStep === 1) {
                const roomSelect = document.getElementById('book-room');
                if (!roomSelect.value) {
                    alert('Por favor, seleccione una habitación para continuar.');
                    return;
                }
                
                // Validate Dates
                const checkin = new Date(this.bookCheckin.value);
                const checkout = new Date(this.bookCheckout.value);
                if (checkout <= checkin) {
                    alert('La fecha de salida debe ser posterior a la fecha de llegada.');
                    return;
                }
            }
        }

        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById(`step-${stepNum}`);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentBookingStep = stepNum;
        }
        
        this.updateBookingSummary();
    }

    // Dynamic Invoice Calculation
    updateBookingSummary() {
        const roomSelect = document.getElementById('book-room');
        const emptyMsg = document.getElementById('summary-empty-msg');
        const detailsList = document.getElementById('summary-details-list');

        if (!roomSelect.value || !this.bookCheckin.value || !this.bookCheckout.value) {
            emptyMsg.classList.remove('d-none');
            detailsList.classList.add('d-none');
            return;
        }

        // Display summary layout
        emptyMsg.classList.add('d-none');
        detailsList.classList.remove('d-none');

        // Dates Calculations
        const checkin = new Date(this.bookCheckin.value);
        const checkout = new Date(this.bookCheckout.value);
        const diffTime = Math.abs(checkout - checkin);
        let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (nights <= 0) nights = 1;

        // Room Calculations
        const roomKey = roomSelect.value;
        const roomInfo = roomData[roomKey];
        const roomPrice = roomInfo.price;
        const totalRoomCost = roomPrice * nights;

        // Display Room details
        document.getElementById('summary-room-name').textContent = roomInfo.name;
        document.getElementById('summary-room-cost').textContent = `$${totalRoomCost.toLocaleString('en-US')}`;
        document.getElementById('summary-duration').textContent = `${nights} ${nights === 1 ? 'noche' : 'noches'}`;
        
        // Guests details
        const adults = parseInt(document.getElementById('book-guests').value);
        const kids = parseInt(document.getElementById('book-kids').value);
        const totalPeople = adults + kids;
        document.getElementById('summary-guests-count').textContent = `${totalPeople} ${totalPeople === 1 ? 'persona' : 'personas'} (${adults} A, ${kids} N)`;

        // Addons Calculations
        let addonsHTML = '';
        let totalAddonsCost = 0;

        // Checkbox: Heliport Transfer ($600 flat)
        const heliCheckbox = document.getElementById('addon-heliport');
        if (heliCheckbox && heliCheckbox.checked) {
            const price = parseFloat(heliCheckbox.getAttribute('data-price'));
            totalAddonsCost += price;
            addonsHTML += `
                <div class="summary-item sub-item">
                    <span class="summary-label"><i class="fa-solid fa-helicopter"></i> Transfer Helipuerto (Fijo)</span>
                    <span class="summary-value">$${price.toLocaleString('en-US')}</span>
                </div>
            `;
        }

        // Checkbox: Mayordomo VIP ($200/night)
        const butlerCheckbox = document.getElementById('addon-butler');
        if (butlerCheckbox && butlerCheckbox.checked) {
            const pricePerNight = parseFloat(butlerCheckbox.getAttribute('data-price'));
            const cost = pricePerNight * nights;
            totalAddonsCost += cost;
            addonsHTML += `
                <div class="summary-item sub-item">
                    <span class="summary-label"><i class="fa-solid fa-shirt"></i> Mayordomo VIP (${nights} n)</span>
                    <span class="summary-value">$${cost.toLocaleString('en-US')}</span>
                </div>
            `;
        }

        // Checkbox: All-inclusive ($150 per person per day)
        const allincCheckbox = document.getElementById('addon-allinc');
        if (allincCheckbox && allincCheckbox.checked) {
            const pricePerPersonDay = parseFloat(allincCheckbox.getAttribute('data-price'));
            const cost = pricePerPersonDay * totalPeople * nights;
            totalAddonsCost += cost;
            addonsHTML += `
                <div class="summary-item sub-item">
                    <span class="summary-label"><i class="fa-solid fa-utensils"></i> Todo Incluido (${totalPeople} p, ${nights} n)</span>
                    <span class="summary-value">$${cost.toLocaleString('en-US')}</span>
                </div>
            `;
        }

        // Checkbox: Spa VIP ($120 flat)
        const spaCheckbox = document.getElementById('addon-spa');
        if (spaCheckbox && spaCheckbox.checked) {
            const price = parseFloat(spaCheckbox.getAttribute('data-price'));
            totalAddonsCost += price;
            addonsHTML += `
                <div class="summary-item sub-item">
                    <span class="summary-label"><i class="fa-solid fa-spa"></i> Pase Diario Spa (Fijo)</span>
                    <span class="summary-value">$${price.toLocaleString('en-US')}</span>
                </div>
            `;
        }

        // Render addons list
        const addonsListContainer = document.getElementById('summary-addons-list');
        const addonsSection = document.getElementById('summary-addons-container');
        if (addonsHTML) {
            addonsSection.classList.remove('d-none');
            addonsListContainer.innerHTML = addonsHTML;
        } else {
            addonsSection.classList.add('d-none');
            addonsListContainer.innerHTML = '';
        }

        // Totals Calculations
        const subtotal = totalRoomCost + totalAddonsCost;
        const taxes = subtotal * 0.16;
        const grandTotal = subtotal + taxes;

        // Render Totals
        document.getElementById('summary-subtotal').textContent = `$${subtotal.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
        document.getElementById('summary-taxes').textContent = `$${taxes.toLocaleString('en-US', {maximumFractionDigits: 2})}`;
        document.getElementById('summary-grandtotal').textContent = `$${grandTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    }

    // Submit Bookings Form (Real PayPal Integration request)
    handleBookingSubmit(event) {
        event.preventDefault();

        const guestName = document.getElementById('guest-fullname').value;
        const roomSelect = document.getElementById('book-room');
        const roomKey = roomSelect.value;
        const roomInfo = roomData[roomKey];
        const checkin = this.bookCheckin.value;
        const checkout = this.bookCheckout.value;

        // Date Diff
        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        const diffTime = Math.abs(checkoutDate - checkinDate);
        let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (nights <= 0) nights = 1;

        // Addons Summary
        let addonsList = [];
        if (document.getElementById('addon-heliport').checked) addonsList.push('Helipuerto');
        if (document.getElementById('addon-butler').checked) addonsList.push('Mayordomo VIP');
        if (document.getElementById('addon-allinc').checked) addonsList.push('Todo Incluido');
        if (document.getElementById('addon-spa').checked) addonsList.push('Spa VIP');
        
        const addonsStr = addonsList.length > 0 ? addonsList.join(', ') : 'Ninguno';

        // Get total price from invoice card text
        const totalStr = document.getElementById('summary-grandtotal').textContent;

        const guestEmail = document.getElementById('guest-email').value;
        const guestPhone = document.getElementById('guest-phone').value;
        const guestRequests = document.getElementById('guest-requests').value;

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Redirigiendo a PayPal...';

        // Enviar al Backend API de PayPal
        fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestName,
                guestEmail,
                guestPhone,
                roomKey,
                roomName: roomInfo.name,
                checkin,
                checkout,
                nights,
                addons: addonsStr,
                guestRequests,
                total: totalStr,
                telegramChatId: this.telegramChatId
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error al registrar la orden en PayPal Sandbox');
                }).catch(() => {
                    throw new Error('Error al registrar la orden en PayPal Sandbox (Respuesta de servidor inválida)');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.approveUrl) {
                // Redirigir al usuario al Checkout Sandbox de PayPal
                window.location.href = data.approveUrl;
            } else {
                throw new Error('No se recibió la URL de aprobación de PayPal');
            }
        })
        .catch(error => {
            console.error('PayPal Integration Error:', error);
            alert('Hubo un problema al iniciar el pago con PayPal: ' + error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        });
    }

    closeReceiptModal() {
        this.receiptModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset Form and Steps
        this.bookingForm.reset();
        this.goToStep(1);
        this.updateBookingSummary();
        
        // Navigate back to home
        window.location.hash = 'home';
    }

    // Submit Contacts Form (Mock API request)
    handleContactSubmit(event) {
        event.preventDefault();
        
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;

        // Simple customized visual toast feedback
        alert(`¡Gracias por contactarnos, ${name}! Hemos recibido tu mensaje y enviaremos una respuesta detallada a tu correo (${email}) en un lapso máximo de 2 horas.`);
        
        // Reset form
        this.contactForm.reset();
    }

    // Geolocation Methods
    getUserLocation() {
        const geoStatus = document.getElementById('geo-status');
        const geoData = document.getElementById('geo-data');
        const geoCoords = document.getElementById('geo-coords');
        const geoDistance = document.getElementById('geo-distance');
        const btnGeo = document.getElementById('btn-geolocation');

        if (!navigator.geolocation) {
            geoStatus.textContent = 'La geolocalización no es soportada por su navegador.';
            geoStatus.style.color = 'var(--color-error)';
            return;
        }

        geoStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Solicitando acceso a tu ubicación...';
        btnGeo.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Show coords
                geoCoords.textContent = `${userLat.toFixed(5)}°, ${userLng.toFixed(5)}°`;
                
                // Reverse geocoding with OpenStreetMap Nominatim (Free)
                const locationNameSpan = document.getElementById('geo-location-name');
                locationNameSpan.textContent = 'Buscando dirección...';
                
                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLat}&lon=${userLng}`)
                    .then(response => response.json())
                    .then(data => {
                        const address = data.address || {};
                        const city = address.city || address.town || address.village || address.municipality || '';
                        const state = address.state || '';
                        const country = address.country || '';
                        
                        let placeName = '';
                        if (city) placeName += city;
                        if (state) placeName += (placeName ? ', ' : '') + state;
                        if (country) placeName += (placeName ? ', ' : '') + country;
                        
                        locationNameSpan.textContent = placeName || data.display_name || 'Ubicación no identificada';
                    })
                    .catch(err => {
                        console.error('Error en geocodificación inversa:', err);
                        locationNameSpan.textContent = 'Error al obtener la dirección.';
                    });

                // Hotel coordinates (Cancun, MX)
                const hotelLat = 21.1378;
                const hotelLng = -86.7483;
                
                // Calculate distance using Haversine formula
                const distance = this.calculateDistance(userLat, userLng, hotelLat, hotelLng);
                
                geoStatus.innerHTML = '<span style="color:var(--color-success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Ubicación detectada</span>';
                
                // Formatted distance display
                if (distance < 1) {
                    geoDistance.innerHTML = `<i class="fa-solid fa-location-arrow"></i> ¡Ya estás en Gupi Palace & Resort! Disfruta tu estancia.`;
                } else {
                    geoDistance.innerHTML = `<i class="fa-solid fa-location-arrow"></i> Estás a <strong>${distance.toLocaleString('es-MX', {maximumFractionDigits: 1})} km</strong> de distancia.`;
                }
                
                geoData.classList.remove('d-none');
                btnGeo.disabled = false;
                btnGeo.innerHTML = '<i class="fa-solid fa-rotate"></i> Actualizar Ubicación';
            },
            (error) => {
                btnGeo.disabled = false;
                btnGeo.innerHTML = '<i class="fa-solid fa-compass"></i> Calcular Distancia';
                geoData.classList.add('d-none');
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        geoStatus.innerHTML = '<span style="color:var(--color-error);"><i class="fa-solid fa-circle-xmark"></i> Permiso de ubicación denegado.</span>';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        geoStatus.innerHTML = '<span style="color:var(--color-error);"><i class="fa-solid fa-circle-xmark"></i> Ubicación no disponible.</span>';
                        break;
                    case error.TIMEOUT:
                        geoStatus.innerHTML = '<span style="color:var(--color-error);"><i class="fa-solid fa-circle-xmark"></i> Tiempo de espera agotado.</span>';
                        break;
                    default:
                        geoStatus.innerHTML = '<span style="color:var(--color-error);"><i class="fa-solid fa-circle-xmark"></i> Error al localizar tu ubicación.</span>';
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // ==========================================================================
    // CRUD ADMIN DASHBOARD ENGINE
    // ==========================================================================

    // 1. Cargar las reservaciones desde la API
    fetchBookings() {
        const tbody = document.getElementById('admin-bookings-tbody');
        if (!tbody) return;

        fetch('/api/bookings')
            .then(res => {
                if (!res.ok) throw new Error('Error al cargar reservaciones de la base de datos');
                return res.json();
            })
            .then(data => {
                this.adminBookings = data;
                this.renderAdminTable(data);
                this.updateAdminStats(data);
            })
            .catch(error => {
                console.error('Fetch Bookings Error:', error);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center; padding: 40px; color: var(--color-error);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size:1.5rem; margin-bottom:10px; display:block;"></i> Error al cargar datos: ${error.message}
                        </td>
                    </tr>
                `;
            });
    }

    // 2. Renderizar tabla de administración
    renderAdminTable(bookings) {
        const tbody = document.getElementById('admin-bookings-tbody');
        if (!tbody) return;

        if (bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
                        <i class="fa-solid fa-folder-open" style="font-size:1.5rem; margin-bottom:10px; display:block;"></i> No se encontraron reservaciones registradas.
                    </td>
                </tr>
            `;
            return;
        }

        // Ordenar por fecha de creación desc
        const sorted = [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        tbody.innerHTML = sorted.map(b => {
            const statusClass = `status-${b.status.toLowerCase()}`;
            return `
                <tr id="row-${b.code}">
                    <td><strong>${b.code}</strong></td>
                    <td>
                        <div style="font-weight:600; color:#fff;">${b.guestName}</div>
                        <div style="font-size:0.8rem; color:var(--color-text-muted);">${b.guestEmail}</div>
                    </td>
                    <td>${b.roomName}</td>
                    <td>
                        <div><i class="fa-solid fa-arrow-right-to-bracket" style="font-size:0.75rem; color:var(--color-gold);"></i> ${b.checkin}</div>
                        <div><i class="fa-solid fa-arrow-right-from-bracket" style="font-size:0.75rem; color:var(--color-error);"></i> ${b.checkout}</div>
                    </td>
                    <td>${b.nights} ${b.nights === 1 ? 'noche' : 'noches'}</td>
                    <td class="text-gold" style="font-weight:600;">${b.total}</td>
                    <td><span class="badge-status ${statusClass}">${b.status}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-action-view" onclick="app.openAdminViewDetailModal('${b.code}')" title="Ver Recibo"><i class="fa-solid fa-receipt"></i></button>
                            <button class="btn-action btn-action-edit" onclick="app.openEditBookingModal('${b.code}')" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-action btn-action-delete" onclick="app.openDeleteBookingModal('${b.code}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 3. Actualizar métricas del dashboard
    updateAdminStats(bookings) {
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'Confirmada').length;
        const pendingBookings = bookings.filter(b => b.status === 'Pendiente').length;

        // Calcular ingresos sumando el total de las confirmadas
        let totalRevenue = 0;
        bookings.forEach(b => {
            if (b.status === 'Confirmada') {
                const num = parseFloat(b.total.replace(/[$,]/g, ''));
                if (!isNaN(num)) {
                    totalRevenue += num;
                }
            }
        });

        document.getElementById('stat-total-bookings').textContent = totalBookings;
        document.getElementById('stat-confirmed-bookings').textContent = confirmedBookings;
        document.getElementById('stat-pending-bookings').textContent = pendingBookings;
        document.getElementById('stat-total-revenue').textContent = `$${totalRevenue.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    }

    // 4. Filtrar y buscar en la tabla en el cliente
    filterAdminBookings() {
        const searchQuery = document.getElementById('admin-search-input').value.toLowerCase();
        const filterRoom = document.getElementById('admin-filter-room').value;
        const filterStatus = document.getElementById('admin-filter-status').value;

        const filtered = this.adminBookings.filter(b => {
            const matchesSearch = b.guestName.toLowerCase().includes(searchQuery) || b.code.toLowerCase().includes(searchQuery);
            const matchesRoom = !filterRoom || b.roomKey === filterRoom;
            const matchesStatus = !filterStatus || b.status === filterStatus;
            return matchesSearch && matchesRoom && matchesStatus;
        });

        this.renderAdminTable(filtered);
    }

    // 5. Ver recibo/detalles desde admin
    openAdminViewDetailModal(code) {
        const booking = this.adminBookings.find(b => b.code === code);
        if (!booking) return;

        // Reutilizar el modal de recibo del cliente pero cambiar sutilmente el título a consulta
        document.getElementById('receipt-code').textContent = booking.code;
        document.getElementById('receipt-guest-name').textContent = booking.guestName;
        document.getElementById('receipt-room-name').textContent = booking.roomName;
        document.getElementById('receipt-dates').textContent = `${booking.checkin} al ${booking.checkout}`;
        document.getElementById('receipt-nights').textContent = `${booking.nights} ${booking.nights === 1 ? 'noche' : 'noches'}`;
        document.getElementById('receipt-addons').textContent = booking.addons;
        document.getElementById('receipt-total-value').textContent = booking.total;

        // Cambiar títulos/botones para admin temporalmente
        const headerTitle = this.receiptModal.querySelector('.receipt-header h2');
        const headerDesc = this.receiptModal.querySelector('.receipt-header p');
        const footerMsg = this.receiptModal.querySelector('.receipt-footer-msg');
        const actionBtn = this.receiptModal.querySelector('.receipt-card button');

        const oldTitle = headerTitle.textContent;
        const oldDesc = headerDesc.textContent;
        const oldMsg = footerMsg.textContent;
        const oldBtnText = actionBtn.innerHTML;

        headerTitle.innerHTML = `<i class="fa-solid fa-file-invoice-dollar" style="color:var(--color-gold); margin-bottom:10px; display:block; font-size:2.5rem;"></i> Detalle de Reservación`;
        headerDesc.textContent = `Consulta de datos de registro del huésped.`;
        footerMsg.innerHTML = `<span style="font-size:0.8rem; color:var(--color-text-muted);">Registrada el: ${new Date(booking.createdAt).toLocaleString('es-MX')}</span>`;
        actionBtn.textContent = 'Cerrar Vista';

        // Al cerrar, restaurar textos
        const restoreFn = () => {
            headerTitle.textContent = oldTitle;
            headerDesc.textContent = oldDesc;
            footerMsg.textContent = oldMsg;
            actionBtn.innerHTML = oldBtnText;
            actionBtn.removeEventListener('click', restoreFn);
        };
        actionBtn.addEventListener('click', restoreFn);

        // Open modal
        this.receiptModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 6. Abrir modal para CREAR reserva
    openCreateBookingModal() {
        document.getElementById('admin-modal-title').textContent = 'Registrar Nueva Reservación';
        document.getElementById('admin-modal-subtitle').textContent = 'Ingrese la información completa para dar de alta la estancia.';
        document.getElementById('admin-form-mode').value = 'create';
        document.getElementById('admin-form-booking-code').value = '';
        
        // Reset form
        this.adminBookingForm.reset();
        
        // Set dates defaults
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        
        document.getElementById('admin-form-checkin').value = formatDate(today);
        document.getElementById('admin-form-checkout').value = formatDate(tomorrow);
        document.getElementById('admin-form-status').value = 'Confirmada'; // confirmada por defecto para admin

        this.updateAdminFormPrice();
        
        // Open modal
        this.adminModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 7. Abrir modal para EDITAR reserva
    openEditBookingModal(code) {
        const booking = this.adminBookings.find(b => b.code === code);
        if (!booking) return;

        document.getElementById('admin-modal-title').textContent = `Modificar Reservación ${code}`;
        document.getElementById('admin-modal-subtitle').textContent = 'Actualice los datos de habitación, fechas, servicios o estado.';
        document.getElementById('admin-form-mode').value = 'edit';
        document.getElementById('admin-form-booking-code').value = booking.code;

        // Rellenar campos simples
        document.getElementById('admin-form-guest-name').value = booking.guestName;
        document.getElementById('admin-form-guest-email').value = booking.guestEmail;
        document.getElementById('admin-form-guest-phone').value = booking.guestPhone;
        document.getElementById('admin-form-room').value = booking.roomKey || 'ocean-deluxe';
        document.getElementById('admin-form-checkin').value = booking.checkin;
        document.getElementById('admin-form-checkout').value = booking.checkout;
        document.getElementById('admin-form-status').value = booking.status;

        // Rellenar adultos/niños si existen o estimar por el desglose de personas
        document.getElementById('admin-form-adults').value = '2';
        document.getElementById('admin-form-kids').value = '0';

        // Checkboxes de servicios adicionales
        const addons = booking.addons || '';
        document.getElementById('admin-addon-heliport').checked = addons.includes('Helipuerto');
        document.getElementById('admin-addon-butler').checked = addons.includes('Mayordomo');
        document.getElementById('admin-addon-allinc').checked = addons.includes('Todo Incluido');
        document.getElementById('admin-addon-spa').checked = addons.includes('Spa');

        // Peticiones
        document.getElementById('admin-form-requests').value = booking.guestRequests || '';

        this.updateAdminFormPrice();

        // Open modal
        this.adminModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 8. Calcular precio dinámicamente en el formulario del Admin
    updateAdminFormPrice() {
        const roomKey = document.getElementById('admin-form-room').value;
        const checkinVal = document.getElementById('admin-form-checkin').value;
        const checkoutVal = document.getElementById('admin-form-checkout').value;
        const adults = parseInt(document.getElementById('admin-form-adults').value) || 2;
        const kids = parseInt(document.getElementById('admin-form-kids').value) || 0;

        if (!roomKey || !checkinVal || !checkoutVal) return;

        const checkin = new Date(checkinVal);
        const checkout = new Date(checkoutVal);
        
        let nights = Math.ceil(Math.abs(checkout - checkin) / (1000 * 60 * 60 * 24));
        if (nights <= 0) nights = 1;

        const roomInfo = roomData[roomKey];
        const roomPrice = roomInfo.price;
        const totalRoomCost = roomPrice * nights;
        const totalPeople = adults + kids;

        let totalAddonsCost = 0;
        
        // Helipuerto: $600 fijo
        if (document.getElementById('admin-addon-heliport').checked) {
            totalAddonsCost += 600;
        }
        // Mayordomo: $200 por noche
        if (document.getElementById('admin-addon-butler').checked) {
            totalAddonsCost += 200 * nights;
        }
        // Todo Incluido: $150 por persona por día/noche
        if (document.getElementById('admin-addon-allinc').checked) {
            totalAddonsCost += 150 * totalPeople * nights;
        }
        // Spa VIP: $120 fijo
        if (document.getElementById('admin-addon-spa').checked) {
            totalAddonsCost += 120;
        }

        const subtotal = totalRoomCost + totalAddonsCost;
        const taxes = subtotal * 0.16;
        const grandTotal = subtotal + taxes;

        document.getElementById('admin-form-total-value').textContent = `$${grandTotal.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    }

    // 9. Cerrar modal de Admin
    closeAdminModal() {
        this.adminModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // 10. Enviar formulario del Admin (Creación y Edición)
    handleAdminBookingSubmit(event) {
        event.preventDefault();

        const mode = document.getElementById('admin-form-mode').value;
        const code = document.getElementById('admin-form-booking-code').value;

        const guestName = document.getElementById('admin-form-guest-name').value;
        const guestEmail = document.getElementById('admin-form-guest-email').value;
        const guestPhone = document.getElementById('admin-form-guest-phone').value;
        const roomKey = document.getElementById('admin-form-room').value;
        const roomInfo = roomData[roomKey];
        const checkin = document.getElementById('admin-form-checkin').value;
        const checkout = document.getElementById('admin-form-checkout').value;
        const status = document.getElementById('admin-form-status').value;
        const guestRequests = document.getElementById('admin-form-requests').value;

        // Fechas
        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        if (checkoutDate <= checkinDate) {
            alert('La fecha de salida debe ser posterior a la de llegada.');
            return;
        }
        
        let nights = Math.ceil(Math.abs(checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        if (nights <= 0) nights = 1;

        // Adicionales
        let addonsList = [];
        if (document.getElementById('admin-addon-heliport').checked) addonsList.push('Helipuerto');
        if (document.getElementById('admin-addon-butler').checked) addonsList.push('Mayordomo VIP');
        if (document.getElementById('admin-addon-allinc').checked) addonsList.push('Todo Incluido');
        if (document.getElementById('admin-addon-spa').checked) addonsList.push('Spa VIP');
        const addonsStr = addonsList.length > 0 ? addonsList.join(', ') : 'Ninguno';

        const totalStr = document.getElementById('admin-form-total-value').textContent;

        const payload = {
            guestName,
            guestEmail,
            guestPhone,
            roomKey,
            roomName: roomInfo.name,
            checkin,
            checkout,
            nights,
            addons: addonsStr,
            guestRequests,
            total: totalStr,
            status
        };

        const submitBtn = document.getElementById('admin-form-submit-btn');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        let url = '/api/bookings';
        let method = 'POST';

        if (mode === 'edit') {
            url = `/api/bookings/${code}`;
            method = 'PUT';
        } else {
            payload.telegramChatId = this.telegramChatId;
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error('Error al guardar en la base de datos');
            return res.json();
        })
        .then(() => {
            this.closeAdminModal();
            this.fetchBookings();
            alert(mode === 'edit' ? `Reservación ${code} actualizada con éxito.` : 'Nueva reservación registrada con éxito.');
        })
        .catch(err => {
            console.error(err);
            alert('Error al guardar la reservación: ' + err.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        });
    }

    // 11. Abrir confirmación de eliminación
    openDeleteBookingModal(code) {
        document.getElementById('delete-booking-code').value = code;
        document.getElementById('delete-booking-code-label').textContent = code;
        
        this.deleteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 12. Cerrar confirmación de eliminación
    closeDeleteModal() {
        this.deleteModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // 13. Confirmar eliminación en la API
    confirmDeleteBooking() {
        const code = document.getElementById('delete-booking-code').value;
        if (!code) return;

        fetch(`/api/bookings/${code}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) throw new Error('Error al eliminar la reservación de la base de datos');
            return res.json();
        })
        .then(() => {
            this.closeDeleteModal();
            this.fetchBookings();
            alert(`Reservación ${code} eliminada permanentemente.`);
        })
        .catch(err => {
            console.error(err);
            alert('Error al eliminar: ' + err.message);
        });
    }

    // 14. Verificar Callback de Pago de PayPal
    checkPayPalPaymentCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const isPayPalSuccess = urlParams.get('paypal_success') === 'true';
        const orderId = urlParams.get('token'); // PayPal retorna el ID de orden en 'token'
        const bookingCode = urlParams.get('booking_code');

        if (isPayPalSuccess && orderId && bookingCode) {
            // Mostrar modal de procesamiento de pago
            if (this.paypalLoadingModal) {
                this.paypalLoadingModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Realizar captura de la orden en el backend
            fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    bookingCode: bookingCode
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Error al capturar la transacción de PayPal');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Cerrar modal de procesamiento
                if (this.paypalLoadingModal) {
                    this.paypalLoadingModal.classList.remove('active');
                }

                const booking = data.booking;
                
                // Mostrar Recibo de Confirmación con éxito
                document.getElementById('receipt-code').textContent = booking.code;
                document.getElementById('receipt-guest-name').textContent = booking.guestName;
                document.getElementById('receipt-room-name').textContent = booking.roomName;
                document.getElementById('receipt-dates').textContent = `${booking.checkin} al ${booking.checkout}`;
                document.getElementById('receipt-nights').textContent = `${booking.nights} ${booking.nights === 1 ? 'noche' : 'noches'}`;
                document.getElementById('receipt-addons').textContent = booking.addons;
                
                // Indicar pago completado con PayPal
                document.getElementById('receipt-total-value').innerHTML = `${booking.total} <br><span style="font-size:0.75rem; color:var(--color-success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Pagado con PayPal Sandbox</span>`;

                this.receiptModal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Limpiar parámetros de la URL para evitar reprocesamiento
                window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch(error => {
                console.error('PayPal Capture Error:', error);
                
                // Cerrar modal de procesamiento
                if (this.paypalLoadingModal) {
                    this.paypalLoadingModal.classList.remove('active');
                }
                document.body.style.overflow = 'auto';

                alert('Error al validar tu pago de PayPal: ' + error.message + '\nPor favor, contacta a nuestro equipo con tu código de reserva: ' + bookingCode);
                
                // Limpiar parámetros de la URL
                window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
    }

    // ==========================================================================
    // TMDB ENTERTAINMENT METHODS
    // ==========================================================================
    fetchMovies(category = 'popular', query = '') {
        const grid = document.getElementById('movies-grid');
        if (!grid) return;

        // Mostrar estado de carga
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px; display: block; color: var(--color-gold);"></i>
                Cargando películas exclusivas...
            </div>
        `;

        let url = '';
        if (query) {
            url = `https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&language=es-MX&query=${encodeURIComponent(query)}&page=1`;
        } else {
            url = `https://api.themoviedb.org/3/movie/${category}?api_key=${this.tmdbApiKey}&language=es-MX&page=1`;
        }

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Error al conectar con el servicio de entretenimiento TMDB');
                return res.json();
            })
            .then(data => {
                this.renderMovies(data.results);
            })
            .catch(err => {
                console.error(err);
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-error);">
                        <i class="fa-solid fa-circle-exclamation" style="font-size: 2.2rem; margin-bottom: 15px; display: block;"></i>
                        No se pudo conectar con el catálogo de entretenimiento en este momento. Por favor, intente más tarde.
                    </div>
                `;
            });
    }

    renderMovies(movies) {
        const grid = document.getElementById('movies-grid');
        if (!grid) return;

        if (!movies || movies.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-text-secondary);">
                    <i class="fa-solid fa-film" style="font-size: 2rem; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    No se encontraron películas. Intenta buscando otro título.
                </div>
            `;
            return;
        }

        grid.innerHTML = '';

        movies.forEach(movie => {
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            const posterUrl = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : 'https://images.unsplash.com/photo-1542204113-e9352628636f?auto=format&fit=crop&q=80&w=500'; // luxury movie fallback

            const movieCardHtml = `
                <div class="movie-card">
                    <div class="movie-image" style="background-image: url('${posterUrl}');">
                        <span class="movie-badge"><i class="fa-solid fa-star"></i> ${rating}</span>
                    </div>
                    <div class="movie-details">
                        <span class="movie-release">${releaseYear}</span>
                        <h3>${movie.title}</h3>
                        <p class="movie-desc">${movie.overview || 'Sinopsis no disponible. Disfrute de esta exclusiva selección en la comodidad de su suite.'}</p>
                        <div class="movie-footer">
                            <button class="btn btn-gold btn-sm btn-block" onclick="app.openCastModal('${movie.title.replace(/'/g, "\\'")}')">
                                <i class="fa-solid fa-tower-broadcast"></i> Transmitir a Suite
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', movieCardHtml);
        });
    }

    handleMovieSearch() {
        const searchInput = document.getElementById('movie-search-input');
        if (!searchInput) return;
        const query = searchInput.value.trim();

        if (query) {
            // Desmarcar todos los botones de categoría
            document.querySelectorAll('#entertainment-view .filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.fetchMovies('', query);
        } else {
            // Si el buscador está vacío, cargar las populares por defecto
            const popularBtn = document.getElementById('movie-filter-popular');
            if (popularBtn) {
                this.filterMoviesCategory('popular', popularBtn);
            } else {
                this.fetchMovies('popular');
            }
        }
    }

    filterMoviesCategory(category, element) {
        // Limpiar el buscador
        const searchInput = document.getElementById('movie-search-input');
        if (searchInput) searchInput.value = '';

        // Actualizar clase activa en los botones
        document.querySelectorAll('#entertainment-view .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (element) element.classList.add('active');

        this.fetchMovies(category);
    }

    openCastModal(movieTitle) {
        const titleElem = document.getElementById('cast-movie-title');
        if (titleElem) titleElem.textContent = movieTitle;

        if (this.movieCastModal) {
            this.movieCastModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCastModal() {
        if (this.movieCastModal) {
            this.movieCastModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

// Instantiate App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HotelApp();
    window.app = app; // Expose to window object for inline HTML event handlers
});
