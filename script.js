var products = [];

var cart = [];
var db;

document.addEventListener('DOMContentLoaded', async function() {
    initFirebase();
    loadTheme();
    await loadProductsFromFirebase();
    renderProducts(products);
    setupFilters();
    checkAdminLogin();
    trackVisitor();
    requestNotificationPermission();
});

function initFirebase() {
    var firebaseConfig = {
        apiKey: "AIzaSyCDnZPBaBpg9FaYOIhgENrvvieLK49OTeI",
        authDomain: "notifications-61cf3.firebaseapp.com",
        projectId: "notifications-61cf3",
        storageBucket: "notifications-61cf3.firebasestorage.app",
        messagingSenderId: "457476846801",
        appId: "1:457476846801:web:4650aae7af87bcd650c1f0",
        measurementId: "G-5MJCBDEG5Y"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
    if (db) {
        db.collection('products').onSnapshot(function(snapshot) {
            snapshot.docChanges().forEach(function(change) {
                if (change.type === 'added' || change.type === 'modified') {
                    var fp = change.doc.data();
                    fp.id = Number(change.doc.id);
                    var existingIndex = products.findIndex(function(p) { return Number(p.id) === fp.id; });
                    if (existingIndex >= 0) {
                        products[existingIndex] = fp;
                    } else {
                        products.push(fp);
                    }
                    renderProducts(products);
                }
            });
        });
    }
    
    if (firebase.messaging && firebase.messaging.isSupported()) {
        var messaging = firebase.messaging();
        messaging.usePublicVapidKey("BIJImK19REAXSKC7s8hOGIzQ904lIOmOTdXUOeUkxcCJF2T2AlFsvGkLhTsRFJXuQfekIWs32vLuPXj0XMIpGCY");
        
        messaging.onMessage(function(payload) {
            console.log('Message received:', payload);
            if (payload.notification) {
                new Notification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: 'logo.png'
                });
            }
        });
        
        messaging.getToken().then(function(currentToken) {
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                localStorage.setItem('fcm_token', currentToken);
                saveTokenToFirebase(currentToken);
            }
        }).catch(function(err) {
            console.log('Error getting FCM token:', err);
        });
    }
}

async function saveTokenToFirebase(token) {
    try {
        await db.collection('tokens').doc(token).set({
            token: token,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.log('Error saving token:', e);
    }
}

async function loadProductsFromFirebase() {
    try {
        var snapshot = await db.collection('products').get();
        if (!snapshot.empty) {
            products = snapshot.docs.map(function(doc) {
                var data = doc.data();
                data.id = Number(doc.id);
                return data;
            });
        } else {
            localStorage.setItem('sticers_products', JSON.stringify(products));
        }
    } catch (error) {
        console.log('Using local products, Firebase error:', error.message);
        var stored = localStorage.getItem('sticers_products');
        if (stored) {
            var parsed = JSON.parse(stored);
            parsed.forEach(function(p) { p.id = Number(p.id); });
            products = parsed;
        }
    }
}

async function saveOrderToFirebase(order) {
    try {
        await db.collection('orders').doc(order.id).set(order);
        sendPushNotification(order);
        return { success: true };
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        return { success: false, error: error.message };
    }
}

async function sendPushNotification(order) {
    try {
        var notification = {
            title: 'New Order Received!',
            body: 'Order #' + order.id + ' - ' + order.total.toFixed(2) + ' DT from ' + order.customer.name,
            icon: 'logo.png',
            click_action: 'admin.html'
        };
        
        await db.collection('notifications').add({
            orderId: order.id,
            customerName: order.customer.name,
            total: order.total,
            message: notification.body,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon
            });
        }
    } catch (error) {
        console.log('Notification error:', error);
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

async function saveMessageToFirebase(message) {
    try {
        await db.collection('messages').add({
            ...message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving message to Firebase:', error);
        return { success: false, error: error.message };
    }
}

async function saveSubscriberToFirebase(email) {
    try {
        await db.collection('subscribers').add({
            email: email,
            subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving subscriber to Firebase:', error);
        return { success: false, error: error.message };
    }
}

function trackVisitor() {
    var visitors = JSON.parse(localStorage.getItem('stickzone_visitors') || '[]');
    var visitorId = localStorage.getItem('stickzone_visitor_id');
    
    if (!visitorId) {
        visitorId = 'V' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        localStorage.setItem('stickzone_visitor_id', visitorId);
    }
    
    var currentPage = window.location.href;
    var lastVisit = localStorage.getItem('stickzone_last_visit');
    var now = Date.now();
    var isNewSession = !lastVisit || (now - parseInt(lastVisit)) > 30 * 60 * 1000;
    var existingVisitor = visitors.find(function(v) { return v.id === visitorId; });
    
    if (isNewSession || !existingVisitor) {
        var visitor = {
            id: visitorId,
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            pageVisited: currentPage,
            pagesVisited: [currentPage],
            visitCount: existingVisitor ? existingVisitor.visitCount + 1 : 1,
            online: true
        };
        
        if (existingVisitor) {
            existingVisitor.lastVisit = visitor.lastVisit;
            existingVisitor.pageVisited = currentPage;
            if (!existingVisitor.pagesVisited.includes(currentPage)) {
                existingVisitor.pagesVisited.push(currentPage);
            }
            existingVisitor.visitCount = visitor.visitCount;
            existingVisitor.online = true;
        } else {
            visitors.push(visitor);
        }
    } else {
        existingVisitor.pageVisited = currentPage;
        existingVisitor.lastVisit = new Date().toISOString();
        existingVisitor.online = true;
        if (!existingVisitor.pagesVisited.includes(currentPage)) {
            existingVisitor.pagesVisited.push(currentPage);
        }
    }
    
    localStorage.setItem('stickzone_visitors', JSON.stringify(visitors));
    localStorage.setItem('stickzone_last_visit', now.toString());
    updateVisitorsOnlineStatus();
}

function updateVisitorsOnlineStatus() {
    var visitors = JSON.parse(localStorage.getItem('stickzone_visitors') || '[]');
    var now = Date.now();
    
    visitors.forEach(function(visitor) {
        var lastVisit = new Date(visitor.lastVisit).getTime();
        visitor.online = (now - lastVisit) < 5 * 60 * 1000;
    });
    
    localStorage.setItem('stickzone_visitors', JSON.stringify(visitors));
}

function checkAdminLogin() {
    var userDisplay = document.getElementById('currentUserDisplay');
    
    var isAdminLogged = localStorage.getItem('stickzone_admin_logged') === 'true';
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    var currentUser = localStorage.getItem('stickzone_current_user');
    
    if (isAdminLogged || (currentUser && authorizedUsers.includes(currentUser))) {
        if (userDisplay) {
            userDisplay.style.display = 'block';
            userDisplay.innerHTML = '<span style="color: #6c5ce7; font-weight: 600;"><i class="fas fa-user"></i> ' + (currentUser || 'Admin') + '</span>';
        }
    } else {
        if (userDisplay) {
            userDisplay.style.display = 'none';
        }
    }
}

function getCurrentUser() {
    return localStorage.getItem('stickzone_current_user');
}

function renderProducts(productsToRender) {
    var productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    productsToRender.forEach(function(product) {
        var badgeHTML = product.badge ? '<span class="product-badge">' + product.badge + '</span>' : '';
        var originalPriceHTML = product.originalPrice ? '<span class="original-price">' + product.originalPrice.toFixed(2) + ' DT</span>' : '';
        
        var reviews = JSON.parse(localStorage.getItem('stickzone_reviews_' + product.id) || '[]');
        var avgRating = reviews.length > 0 ? (reviews.reduce(function(a, b) { return a + b.rating; }, 0) / reviews.length).toFixed(1) : product.rating || 0;
        var reviewCount = reviews.length || product.reviewCount || 0;
        
        var starsHTML = '';
        for (var i = 1; i <= 5; i++) {
            if (i <= Math.round(avgRating)) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        var imageHTML = product.image ? 
            '<img src="' + product.image + '" alt="' + product.name + '" class="product-img" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' :
            '';
        var emojiFallback = product.image ? 'style="display:none;"' : '';
        
        var html = '<div class="product-card fade-in">' +
            '<div class="product-image">' + badgeHTML +
            '<span class="product-emoji" ' + emojiFallback + '>' + product.emoji + '</span>' +
            imageHTML + '</div>' +
            '<div class="product-info"><span class="product-category">' + product.category + '</span>' +
            '<h3 class="product-title">' + product.name + '</h3>' +
            '<div class="product-rating">' + starsHTML + '<span class="rating-count">(' + reviewCount + ')</span></div>' +
            '<p class="product-description">' + product.description + '</p>' +
            '<div class="product-footer"><span class="product-price">' + product.price.toFixed(2) + ' DT ' + originalPriceHTML + 
            '</span><button class="add-to-cart" onclick="addToCart(' + product.id + ')"><i class="fas fa-plus"></i> Add</button></div></div></div>';
        
        productGrid.innerHTML += html;
    });
}

function setupFilters() {
    var filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterButtons.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var category = btn.dataset.category;
            if (category === 'all') {
                renderProducts(products);
            } else {
                renderProducts(products.filter(function(p) { return p.category === category; }));
            }
        });
    });
}

function searchProducts() {
    var searchTerm = document.getElementById('searchInput').value.toLowerCase();
    var activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
    var filtered = products.filter(function(product) {
        var matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                           product.description.toLowerCase().includes(searchTerm);
        var matchesCategory = activeCategory === 'all' || product.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    sortAndRender(filtered);
}

function sortProducts() {
    var activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
    var searchTerm = document.getElementById('searchInput').value.toLowerCase();
    var filtered = products.filter(function(product) {
        var matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm) || 
                           product.description.toLowerCase().includes(searchTerm);
        var matchesCategory = activeCategory === 'all' || product.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    sortAndRender(filtered);
}

function sortAndRender(productsToSort) {
    var sortValue = document.getElementById('sortSelect').value;
    switch(sortValue) {
        case 'price-low':
            productsToSort.sort(function(a, b) { return a.price - b.price; });
            break;
        case 'price-high':
            productsToSort.sort(function(a, b) { return b.price - a.price; });
            break;
        case 'name':
            productsToSort.sort(function(a, b) { return a.name.localeCompare(b.name); });
            break;
    }
    renderProducts(productsToSort);
}

function addToCart(productId) {
    var product = products.find(function(p) { return Number(p.id) === Number(productId); });
    var existingItem = cart.find(function(item) { return Number(item.id) === Number(productId); });

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: product.id, name: product.name, emoji: product.emoji, price: product.price, quantity: 1 });
    }

    updateCartUI();
    var btn = event.target.closest('.add-to-cart');
    var originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Added';
    btn.style.background = '#00b894';
    setTimeout(function() { btn.innerHTML = originalHTML; btn.style.background = ''; }, 1000);
}

function removeFromCart(productId) {
    cart = cart.filter(function(item) { return Number(item.id) !== Number(productId); });
    updateCartUI();
}

function updateQuantity(productId, change) {
    var item = cart.find(function(item) { return Number(item.id) === Number(productId); });
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) { removeFromCart(productId); } else { updateCartUI(); }
    }
}

function updateCartUI() {
    var cartCount = document.getElementById('cartCount');
    var cartItems = document.getElementById('cartItems');
    var cartTotal = document.getElementById('cartTotal');

    var totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '0.00 DT';
    } else {
        cartItems.innerHTML = cart.map(function(item) {
            var imageHtml = item.image ? '<img src="' + item.image + '" alt="' + item.name + '" class="cart-item-img">' : (item.emoji || '📦');
            return '<div class="cart-item"><div class="cart-item-image">' + imageHtml + '</div>' +
                '<div class="cart-item-details"><h4 class="cart-item-title">' + item.name + '</h4>' +
                '<span class="cart-item-price">' + item.price.toFixed(2) + ' DT</span>' +
                '<div class="cart-item-quantity"><button onclick="updateQuantity(' + item.id + ', -1)">-</button>' +
                '<span>' + item.quantity + '</span><button onclick="updateQuantity(' + item.id + ', 1)">+</button></div></div>' +
                '<button class="remove-item" onclick="removeFromCart(' + item.id + ')"><i class="fas fa-trash"></i></button></div>';
        }).join('');
        cartTotal.textContent = '' + cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0).toFixed(2) + ' DT';
    }
}

function toggleCart() {
    var cart = document.getElementById('cartSidebar');
    var overlay = document.getElementById('overlay');
    cart.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = cart.classList.contains('active') ? 'hidden' : '';
}

function checkout() {
    if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }
    var totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    if (totalItems < 20) { showToast('Minimum order is 20 stickers!', 'warning'); return; }
    toggleCart();
    var subtotal = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    var shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    var shipping = getShippingCost(shippingMethod);
    var total = subtotal + shipping;
    document.getElementById('checkoutSubtotal').textContent = '' + subtotal.toFixed(2) + ' DT';
    document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'FREE' : '' + shipping.toFixed(2) + ' DT';
    document.getElementById('checkoutTotal').textContent = '' + total.toFixed(2) + ' DT';
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function selectShipping(method) {
    var subtotal = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    var shipping = getShippingCost(method);
    var total = subtotal + shipping;
    document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'FREE' : '' + shipping.toFixed(2) + ' DT';
    document.getElementById('checkoutTotal').textContent = '' + total.toFixed(2) + ' DT';
    document.getElementById('codAmount').textContent = '' + total.toFixed(2) + ' DT';
}

function getShippingCost(method) {
    switch(method) {
        case 'express': return 8.00;
        case 'pickup': return 0;
        default: return 0;
    }
}

async function handleCheckout(event) {
    event.preventDefault();
    var totalItems = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    if (totalItems < 20) { showToast('Minimum order is 20 stickers!', 'warning'); return; }
    var subtotal = cart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
    var shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    var shipping = getShippingCost(shippingMethod);
    var total = subtotal + shipping;
    
    var order = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customer: { 
            name: document.getElementById('name').value, 
            email: document.getElementById('email').value, 
            address: document.getElementById('address').value 
        },
        items: cart.slice(),
        subtotal: subtotal, 
        shipping: shipping, 
        total: total, 
        paymentMethod: 'Cash on Delivery', 
        status: 'pending'
    };
    
    var orders = JSON.parse(localStorage.getItem('sticers_orders') || '[]');
    orders.push(order);
    localStorage.setItem('sticers_orders', JSON.stringify(orders));
    
    await saveOrderToFirebase(order);
    
    document.getElementById('codAmount').textContent = '' + total.toFixed(2) + ' DT';
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('checkoutForm').reset();
    document.getElementById('successModal').classList.add('active');
    cart = [];
    updateCartUI();
}

function closeCheckout() { document.getElementById('checkoutModal').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }
function closeSuccess() { document.getElementById('successModal').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }
function closeAll() { document.getElementById('cartSidebar').classList.remove('active'); document.getElementById('checkoutModal').classList.remove('active'); document.getElementById('successModal').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }

async function handleContactSubmit(event) {
    event.preventDefault();
    var form = event.target;
    var name = form.querySelector('input[type="text"]').value;
    var email = form.querySelector('input[type="email"]').value;
    var message = form.querySelector('textarea').value;
    
    var contactMessage = {
        id: Date.now().toString(),
        name: name,
        email: email,
        message: message,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: 'unread'
    };
    
    var messages = JSON.parse(localStorage.getItem('stickzone_messages') || '[]');
    messages.push(contactMessage);
    localStorage.setItem('stickzone_messages', JSON.stringify(messages));
    
    await saveMessageToFirebase(contactMessage);
    
    showToast('Thank you for your message! We will get back to you soon.', 'success');
    form.reset();
}

async function handleNewsletterSubmit(event) {
    event.preventDefault();
    var email = event.target.querySelector('input').value;
    
    var subscribers = JSON.parse(localStorage.getItem('stickzone_subscribers') || '[]');
    
    if (subscribers.includes(email)) {
        showToast('This email is already subscribed!', 'warning');
        return;
    }
    
    subscribers.push(email);
    localStorage.setItem('stickzone_subscribers', JSON.stringify(subscribers));
    
    await saveSubscriberToFirebase(email);
    
    showToast('Thank you for subscribing!', 'success');
    event.target.reset();
}

function toggleChat() {
    var chat = document.getElementById('supportChat');
    var chatBody = document.getElementById('chatBody');
    var chatArrow = document.getElementById('chatArrow');
    
    chat.classList.toggle('active');
    if (chat.classList.contains('active')) {
        chatBody.style.display = 'block';
        chatArrow.classList.remove('fa-chevron-up');
        chatArrow.classList.add('fa-chevron-down');
    } else {
        chatBody.style.display = 'none';
        chatArrow.classList.remove('fa-chevron-down');
        chatArrow.classList.add('fa-chevron-up');
    }
}

async function sendChatMessage(event) {
    event.preventDefault();
    var input = document.getElementById('chatInput');
    var message = input.value.trim();
    
    if (!message) return;
    
    var messagesDiv = document.getElementById('chatMessages');
    
    var userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = '<p>' + message + '</p>';
    messagesDiv.appendChild(userMsg);
    
    var userName = 'Chat User';
    var userEmail = 'chat@customer.com';
    
    var adminMessages = JSON.parse(localStorage.getItem('stickzone_messages') || '[]');
    var newMessage = {
        id: Date.now().toString(),
        name: userName,
        email: userEmail,
        message: message,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: 'unread'
    };
    adminMessages.push(newMessage);
    localStorage.setItem('stickzone_messages', JSON.stringify(adminMessages));
    
    await saveMessageToFirebase(newMessage);
    
    var chats = JSON.parse(localStorage.getItem('stickzone_chats') || '[]');
    chats.push({ message: message, date: new Date().toLocaleString() });
    localStorage.setItem('stickzone_chats', JSON.stringify(chats));
    
    input.value = '';
    
    setTimeout(function() {
        var botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        botMsg.innerHTML = '<p>Thank you for your message! 💜</p><p>Our team will get back to you soon.</p>';
        messagesDiv.appendChild(botMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 1000);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleMenu() { var navLinks = document.querySelector('.nav-links'); navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex'; }

function showToast(message, type) {
    if (!type) type = 'info';
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    var icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-times-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    
    toast.innerHTML = icons[type] + ' ' + message;
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

function toggleTheme() {
    var html = document.documentElement;
    var toggleBtn = document.getElementById('themeToggle');
    var icon = toggleBtn.querySelector('i');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('stickzone_theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('stickzone_theme', 'dark');
    }
}

function loadTheme() {
    var savedTheme = localStorage.getItem('stickzone_theme');
    var toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    var icon = toggleBtn.querySelector('i');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;