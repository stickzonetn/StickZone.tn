const ADMIN_CREDENTIALS = {
    username: 'pablo',
    password: 'pablo1102'
};

const PRODUCTS_KEY = 'sticers_products';
const ORDERS_KEY = 'sticers_orders';

let isLoggedIn = false;
let products = [];
let orders = [];
let db;

const defaultProducts = [
    { id: 1, name: 'Cute Cat Sticker', category: 'cartoon', image: 'https://picsum.photos/seed/cat/400/400', emoji: '🐱', price: 9.00, originalPrice: 15.00, description: 'Adorable kawaii cat design!', badge: 'Bestseller' },
    { id: 2, name: 'Space Explorer', category: 'cartoon', image: 'https://picsum.photos/seed/space/400/400', emoji: '🚀', price: 10.50, originalPrice: null, description: 'Reach for the stars!', badge: null },
    { id: 3, name: 'Sunset Paradise', category: 'nature', image: 'https://picsum.photos/seed/sunset/400/400', emoji: '🌅', price: 9.00, originalPrice: null, description: 'Beautiful sunset landscape.', badge: null },
    { id: 4, name: 'Forest Vibes', category: 'nature', image: 'https://picsum.photos/seed/forest/400/400', emoji: '🌲', price: 9.90, originalPrice: 13.50, description: 'Peaceful forest scene.', badge: 'Popular' },
    { id: 5, name: 'Dream Big', category: 'quote', image: 'https://picsum.photos/seed/dream/400/400', emoji: '✨', price: 7.50, originalPrice: null, description: 'Inspirational quote sticker.', badge: null },
    { id: 6, name: 'Stay Positive', category: 'quote', image: 'https://picsum.photos/seed/positive/400/400', emoji: '🌸', price: 7.50, originalPrice: null, description: 'Simple yet powerful message.', badge: null },
    { id: 7, name: 'Abstract Dreams', category: 'abstract', image: 'https://picsum.photos/seed/abstract/400/400', emoji: '🎨', price: 12.00, originalPrice: 18.00, description: 'Colorful abstract art.', badge: 'Sale' },
    { id: 8, name: 'Geometric Magic', category: 'abstract', image: 'https://picsum.photos/seed/geometric/400/400', emoji: '💎', price: 10.50, originalPrice: null, description: 'Mesmerizing geometric pattern.', badge: null },
    { id: 9, name: 'Happy Corgi', category: 'cartoon', image: 'https://picsum.photos/seed/corgi/400/400', emoji: '🐕', price: 9.90, originalPrice: null, description: 'The happiest corgi!', badge: null },
    { id: 10, name: 'Ocean Waves', category: 'nature', image: 'https://picsum.photos/seed/ocean/400/400', emoji: '🌊', price: 9.00, originalPrice: 12.00, description: 'Relaxing ocean waves.', badge: 'Popular' },
    { id: 11, name: 'Unicorn Magic', category: 'cartoon', image: 'https://picsum.photos/seed/unicorn/400/400', emoji: '🦄', price: 10.50, originalPrice: null, description: 'Magical unicorn design.', badge: null },
    { id: 12, name: 'Flower Power', category: 'nature', image: 'https://picsum.photos/seed/flower/400/400', emoji: '🌸', price: 7.50, originalPrice: null, description: 'Beautiful floral design.', badge: null }
];

function getProducts() {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
        var parsed = JSON.parse(stored);
        parsed.forEach(function(p) { p.id = Number(p.id); });
        return parsed;
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
}

function saveProducts(items) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
}

function getOrders() {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveOrders(items) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(items));
}

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
        db.collection('orders').onSnapshot(function(snapshot) {
            snapshot.docChanges().forEach(function(change) {
                if (change.type === 'added') {
                    var newOrder = change.doc.data();
                    newOrder.id = change.doc.id;
                    showNewOrderNotification(newOrder);
                }
            });
        });
    }
    
    if (firebase.messaging && firebase.messaging.isSupported()) {
        var messaging = firebase.messaging();
        messaging.usePublicVapidKey("BIJImK19REAXSKC7s8hOGIzQ904lIOmOTdXUOeUkxcCJF2T2AlFsvGkLhTsRFJXuQfekIWs32vLuPXj0XMIpGCY");
        
        messaging.onMessage(function(payload) {
            console.log('Message received in admin:', payload);
            if (payload.notification) {
                new Notification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: 'logo.png'
                });
            }
        });
        
        messaging.getToken().then(function(currentToken) {
            if (currentToken) {
                console.log('Admin FCM Token:', currentToken);
                localStorage.setItem('admin_fcm_token', currentToken);
            }
        }).catch(function(err) {
            console.log('Error getting admin FCM token:', err);
        });
    }
}

function showNewOrderNotification(order) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order!', {
            body: 'Order from ' + order.customer.name + ' - ' + order.total.toFixed(2) + ' DT',
            icon: 'logo.png'
        });
    }
    
    var orderCountEl = document.getElementById('orderCount');
    if (orderCountEl) {
        var current = parseInt(orderCountEl.textContent) || 0;
        orderCountEl.textContent = current + 1;
    }
    
    showToast('New order received from ' + order.customer.name + '!', 'success');
}

async function getOrdersFromFirebase() {
    try {
        var snapshot = await db.collection('orders').get();
        return { 
            success: true, 
            orders: snapshot.docs.map(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                return data;
            }) 
        };
    } catch (error) {
        console.error('Error fetching orders:', error);
        return { success: false, error: error.message };
    }
}

async function getProductsFromFirebase() {
    try {
        var snapshot = await db.collection('products').get();
        return { 
            success: true, 
            products: snapshot.docs.map(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                return data;
            }) 
        };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: error.message };
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await db.collection('orders').doc(orderId).update({ status: status });
        return { success: true };
    } catch (error) {
        console.error('Error updating order:', error);
        return { success: false, error: error.message };
    }
}

async function saveProductToFirebase(product) {
    try {
        await db.collection('products').doc(product.id.toString()).set(product);
        return { success: true };
    } catch (error) {
        console.error('Error saving product:', error);
        return { success: false, error: error.message };
    }
}

async function updateProductInFirebase(productId, data) {
    try {
        await db.collection('products').doc(productId.toString()).update(data);
        return { success: true };
    } catch (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
    }
}

async function deleteProductFromFirebase(productId) {
    try {
        await db.collection('products').doc(productId.toString()).delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: error.message };
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    const accessCode = localStorage.getItem('stickzone_access_code');
    if (password === accessCode && accessCode) {
        isLoggedIn = true;
        localStorage.setItem('stickzone_admin_logged', 'true');
        localStorage.setItem('stickzone_current_user', username);
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        initFirebase();
        loadAdminData();
        initAdminAnalytics();
        requestAdminNotificationPermission();
        return;
    }
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isLoggedIn = true;
        localStorage.setItem('stickzone_admin_logged', 'true');
        localStorage.setItem('stickzone_current_user', 'admin');
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        initFirebase();
        loadAdminData();
        initAdminAnalytics();
        requestAdminNotificationPermission();
    } else {
        showToast('Invalid username or password', 'error');
    }
}

function generateAccessCode() {
    var code = Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('stickzone_access_code', code);
    showToast('Access code generated: ' + code, 'success');
}

function clearAccessCode() {
    localStorage.removeItem('stickzone_access_code');
    showToast('Access code cleared', 'info');
}

function addAuthorizedUser() {
    var username = document.getElementById('newUserUsername').value.trim();
    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    if (authorizedUsers.includes(username)) {
        showToast('User already authorized', 'warning');
        return;
    }
    authorizedUsers.push(username);
    localStorage.setItem('stickzone_authorized_users', JSON.stringify(authorizedUsers));
    document.getElementById('newUserUsername').value = '';
    showToast('User ' + username + ' authorized', 'success');
}

function removeAuthorizedUser(username) {
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    authorizedUsers = authorizedUsers.filter(function(u) { return u !== username; });
    localStorage.setItem('stickzone_authorized_users', JSON.stringify(authorizedUsers));
    showToast('User ' + username + ' removed', 'info');
}

function renderAuthorizedUsers() {
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    var listContainer = document.getElementById('authorizedUsersList');
    if (!listContainer) return;
    if (authorizedUsers.length === 0) {
        listContainer.innerHTML = '<p>No authorized users yet</p>';
    } else {
        listContainer.innerHTML = authorizedUsers.map(function(user) {
            return '<div class="authorized-user">' +
                '<span>' + user + '</span>' +
                '<button class="btn-remove" onclick="removeAuthorizedUser(\'' + user + '\')"><i class="fas fa-times"></i></button>' +
            '</div>';
        }).join('');
    }
}

function getVisitorStats() {
    var visitors = JSON.parse(localStorage.getItem('stickzone_visitors') || '[]');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    var visitorsToday = visitors.filter(function(v) {
        return new Date(v.firstVisit) >= today;
    });
    
    var onlineNow = visitors.filter(function(v) {
        return v.online === true;
    });
    
    return {
        total: visitors.length,
        today: visitorsToday.length,
        online: onlineNow.length
    };
}

function renderVisitorStats() {
    var stats = getVisitorStats();
    document.getElementById('visitorsToday').textContent = stats.today;
    document.getElementById('totalVisitors').textContent = stats.total;
    document.getElementById('usersOnline').textContent = stats.online;
}

function renderVisitorsTable() {
    var visitors = JSON.parse(localStorage.getItem('stickzone_visitors') || '[]');
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    var tbody = document.getElementById('visitorsTableBody');
    
    visitors.sort(function(a, b) {
        return new Date(b.lastVisit) - new Date(a.lastVisit);
    });
    
    if (visitors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No visitors yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = visitors.slice(0, 50).map(function(visitor) {
        var isAuthorized = authorizedUsers.includes(visitor.id);
        var statusClass = visitor.online ? 'online' : 'offline';
        var statusText = visitor.online ? 'Online' : 'Offline';
        var pageName = visitor.pageVisited.split('/').pop() || 'Home';
        
        return '<tr>' +
            '<td>' + visitor.id + '</td>' +
            '<td>' + new Date(visitor.firstVisit).toLocaleDateString() + '</td>' +
            '<td>' + new Date(visitor.lastVisit).toLocaleTimeString() + '</td>' +
            '<td>' + pageName + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
            '<td>' +
                '<button class="btn-grant" onclick="grantVisitorAccess(\'' + visitor.id + '\')" ' + (isAuthorized ? 'disabled' : '') + '>' +
                    '<i class="fas fa-user-plus"></i> ' + (isAuthorized ? 'Granted' : 'Grant') +
                '</button>' +
                '<button class="btn-revoke" onclick="revokeVisitorAccess(\'' + visitor.id + '\')" ' + (!isAuthorized ? 'disabled' : '') + '>' +
                    '<i class="fas fa-user-minus"></i> Revoke' +
                '</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function grantVisitorAccess(visitorId) {
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    if (!authorizedUsers.includes(visitorId)) {
        authorizedUsers.push(visitorId);
        localStorage.setItem('stickzone_authorized_users', JSON.stringify(authorizedUsers));
        showToast('Access granted to ' + visitorId, 'success');
    }
    renderVisitorsTable();
}

function revokeVisitorAccess(visitorId) {
    var authorizedUsers = JSON.parse(localStorage.getItem('stickzone_authorized_users') || '[]');
    authorizedUsers = authorizedUsers.filter(function(u) { return u !== visitorId; });
    localStorage.setItem('stickzone_authorized_users', JSON.stringify(authorizedUsers));
    showToast('Access revoked from ' + visitorId, 'info');
    renderVisitorsTable();
}

var lastVisitorCount = 0;
function checkForNewVisitors() {
    var stats = getVisitorStats();
    var badge = document.getElementById('newVisitorBadge');
    
    if (stats.total > lastVisitorCount && lastVisitorCount > 0) {
        var newCount = stats.total - lastVisitorCount;
        showToast('🔔 ' + newCount + ' new visitor(s)!', 'info');
        if (badge) {
            badge.textContent = newCount;
            badge.style.display = 'flex';
        }
    }
    
    if (badge) {
        if (stats.online > 0) {
            badge.textContent = stats.online;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    lastVisitorCount = stats.total;
}

function initAdminAnalytics() {
    var stats = getVisitorStats();
    lastVisitorCount = stats.total;
    
    setInterval(function() {
        checkForNewVisitors();
        renderVisitorStats();
    }, 10000);
}

function logout() {
    isLoggedIn = false;
    localStorage.removeItem('stickzone_admin_logged');
    localStorage.removeItem('stickzone_current_user');
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').classList.remove('show');
}

async function loadAdminData() {
    products = getProducts();
    orders = getOrders();
    
    if (db) {
        try {
            var firebaseProducts = await getProductsFromFirebase();
            if (firebaseProducts.success && firebaseProducts.products) {
                var localProductIds = products.map(function(p) { return Number(p.id); });
                firebaseProducts.products.forEach(function(fp) {
                    var fpId = Number(fp.id);
                    if (!localProductIds.includes(fpId)) {
                        fp.id = fpId;
                        products.push(fp);
                    }
                });
                if (firebaseProducts.products.length > 0) {
                    saveProducts(products);
                }
            }
        } catch (e) {
            console.log('Using local products (Firebase unavailable)');
        }
        
        try {
            var firebaseOrders = await getOrdersFromFirebase();
            if (firebaseOrders.success && firebaseOrders.orders) {
                var localOrderIds = orders.map(function(o) { return Number(o.id); });
                var newOrders = firebaseOrders.orders.filter(function(o) { return !localOrderIds.includes(Number(o.id)); });
                if (newOrders.length > 0) {
                    orders = orders.concat(newOrders);
                    saveOrders(orders);
                }
            }
        } catch (e) {
            console.log('Using local orders (Firebase unavailable)');
        }
    }
    
    renderProductsTable();
    renderOrders();
    updateOrderCount();
}

function renderProductsTable(searchTerm) {
    if (!searchTerm) searchTerm = '';
    var tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    console.log('Rendering products, count:', products.length);
    
    var filteredProducts = products;
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        filteredProducts = products.filter(function(p) {
            return p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
        });
    }
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(function(product) {
        return '<tr>' +
            '<td>' + product.id + '</td>' +
            '<td><strong>' + product.name + '</strong></td>' +
            '<td><span class="status-badge active">' + product.category + '</span></td>' +
            '<td class="price-cell">' + product.price.toFixed(2) + ' DT</td>' +
            '<td><span class="status-badge active">Active</span></td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="action-btn edit-btn" onclick="editProduct(' + product.id + ')" title="Edit">' +
                        '<i class="fas fa-edit"></i>' +
                    '</button>' +
                    '<button class="action-btn delete-btn" onclick="deleteProduct(' + product.id + ')" title="Delete">' +
                        '<i class="fas fa-trash"></i>' +
                    '</button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }).join('');
}

function searchProducts() {
    var searchTerm = document.getElementById('productSearch').value;
    renderProductsTable(searchTerm);
}

async function addProduct(event) {
    event.preventDefault();
    
    var newId = 1;
    if (products.length > 0) {
        var maxId = Math.max.apply(null, products.map(function(p) { return Number(p.id); }));
        newId = maxId + 1;
    }
    
    var imageInput = document.getElementById('newProductImage');
    var imageData = imageInput.getAttribute('data-image') || null;
    
    var newProduct = {
        id: newId,
        name: document.getElementById('newProductName').value,
        category: document.getElementById('newProductCategory').value,
        image: imageData,
        price: parseFloat(document.getElementById('newProductPrice').value),
        originalPrice: document.getElementById('newProductOriginalPrice').value ? parseFloat(document.getElementById('newProductOriginalPrice').value) : null,
        description: document.getElementById('newProductDescription').value,
        badge: document.getElementById('newProductBadge').value || null,
        active: true
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    if (db) {
        await saveProductToFirebase(newProduct);
    }
    
    clearForm();
    renderProductsTable();
    showToast('Product added successfully!', 'success');
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            input.setAttribute('data-image', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function handleEditImageUpload(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            input.setAttribute('data-image', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearForm() {
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductCategory').value = '';
    document.getElementById('newProductImage').value = '';
    document.getElementById('newProductImage').removeAttribute('data-image');
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductOriginalPrice').value = '';
    document.getElementById('newProductDescription').value = '';
    document.getElementById('newProductBadge').value = '';
}

function editProduct(productIdOrEvent) {
    console.log('editProduct called with:', productIdOrEvent, 'products array:', products);
    var productId = productIdOrEvent;
    if (productIdOrEvent && typeof productIdOrEvent.preventDefault === 'function') {
        productIdOrEvent.preventDefault();
        productIdOrEvent.stopPropagation();
    }
    
    console.log('productId before Number:', productId);
    productId = Number(productId);
    console.log('productId after Number:', productId, 'isNaN:', isNaN(productId));
    
    if (!productId || isNaN(productId)) {
        console.error('editProduct called with invalid id:', productId);
        showToast('Cannot edit product - invalid ID', 'error');
        return;
    }
    
    var product = products.find(function(p) { return Number(p.id) === productId; });
    
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductOriginalPrice').value = product.originalPrice || '';
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductBadge').value = product.badge || '';
    document.getElementById('editProductImageData').value = product.image || '';
    
    document.getElementById('editProductModal').classList.add('active');
    document.getElementById('adminOverlay').classList.add('active');
}

async function updateProduct(event) {
    event.preventDefault();
    
    var productId = parseInt(document.getElementById('editProductId').value);
    var index = products.findIndex(function(p) { return p.id === productId; });
    
    if (index === -1) return;
    
    var imageInput = document.getElementById('editProductImage');
    var newImageData = imageInput.files && imageInput.files[0] ? imageInput.getAttribute('data-image') : null;
    var existingImageData = document.getElementById('editProductImageData').value;
    
    products[index] = {
        id: products[index].id,
        name: document.getElementById('editProductName').value,
        category: document.getElementById('editProductCategory').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        originalPrice: document.getElementById('editProductOriginalPrice').value ? parseFloat(document.getElementById('editProductOriginalPrice').value) : null,
        description: document.getElementById('editProductDescription').value,
        badge: document.getElementById('editProductBadge').value || null,
        image: newImageData || existingImageData || null
    };
    
    saveProducts(products);
    
    if (db) {
        try {
            await updateProductInFirebase(products[index].id, products[index]);
        } catch (e) {
            console.log('Firebase update skipped');
        }
    }
    
    closeEditModal();
    renderProductsTable();
    showToast('Product updated successfully!', 'success');
}

async function deleteProduct(productIdOrEvent) {
    var productId = productIdOrEvent;
    if (productIdOrEvent && typeof productIdOrEvent.preventDefault === 'function') {
        productIdOrEvent.preventDefault();
        productIdOrEvent.stopPropagation();
    }
    
    productId = Number(productId);
    
    console.log('Deleting product with ID:', productId);
    
    if (!productId || isNaN(productId)) {
        showToast('Cannot delete product - invalid ID', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    products = products.filter(function(p) { return Number(p.id) !== productId; });
    saveProducts(products);
    
    if (db) {
        await deleteProductFromFirebase(productId);
    }
    
    renderProductsTable();
    showToast('Product deleted successfully!', 'success');
}

function closeEditModal() {
    document.getElementById('editProductModal').classList.remove('active');
    document.getElementById('adminOverlay').classList.remove('active');
}

async function renderOrders(filter, searchTerm, sortOrder) {
    if (!filter) filter = 'all';
    if (!searchTerm) searchTerm = '';
    if (!sortOrder) sortOrder = 'newest';
    
    orders = getOrders();
    
    if (db) {
        try {
            var firebaseOrders = await getOrdersFromFirebase();
            if (firebaseOrders.success && firebaseOrders.orders) {
                var localOrderIds = orders.map(function(o) { return o.id; });
                var newOrders = firebaseOrders.orders.filter(function(o) { return !localOrderIds.includes(o.id); });
                if (newOrders.length > 0) {
                    orders = orders.concat(newOrders);
                    saveOrders(orders);
                }
            }
        } catch (e) {
            console.log('Using local orders (Firebase unavailable)');
        }
    }
    
    var container = document.getElementById('ordersContainer');
    var emptyState = document.getElementById('emptyOrders');
    
    var totalOrdersEl = document.getElementById('totalOrders');
    var totalRevenueEl = document.getElementById('totalRevenue');
    var pendingOrdersEl = document.getElementById('pendingOrders');
    var completedOrdersEl = document.getElementById('completedOrders');
    
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    var totalRevenue = orders.reduce(function(sum, order) { return sum + (order.total || 0); }, 0);
    if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toFixed(2) + ' DT';
    var pendingOrders = orders.filter(function(o) { return o.status === 'pending'; }).length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    var completedOrders = orders.filter(function(o) { return o.status === 'completed'; }).length;
    if (completedOrdersEl) completedOrdersEl.textContent = completedOrders;
    
    var filteredOrders = orders;
    
    if (filter !== 'all') {
        filteredOrders = filteredOrders.filter(function(o) { return o.status === filter; });
    }
    
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(function(o) {
            return (o.customer && o.customer.name && o.customer.name.toLowerCase().includes(term)) ||
                   (o.customer && o.customer.email && o.customer.email.toLowerCase().includes(term)) ||
                   (o.id && o.id.toString().includes(term));
        });
    }
    
    filteredOrders.sort(function(a, b) {
        if (sortOrder === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else {
            return new Date(a.date) - new Date(b.date);
        }
    });
    
    if (filteredOrders.length === 0) {
        if (container) {
            container.innerHTML = '<div class="orders-empty"><i class="fas fa-shopping-bag"></i><h3>No Orders Yet</h3><p>Orders will appear here when customers make purchases</p></div>';
        }
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (!container) return;
    
    container.innerHTML = '<table class="orders-table"><thead><tr><th>Order ID</th><th>Name</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
        filteredOrders.map(function(order) {
            var statusClass = order.status === 'pending' ? 'pending' : order.status === 'completed' ? 'completed' : 'cancelled';
            return '<tr onclick="viewOrderDetail(\'' + order.id + '\')">' +
                '<td><span class="order-id-cell">#' + order.id + '</span></td>' +
                '<td><span class="order-name-cell">' + (order.customer ? order.customer.name : 'N/A') + '</span></td>' +
                '<td><span class="order-price-cell">' + (order.total || 0).toFixed(2) + ' DT</span></td>' +
                '<td><span class="order-status-badge ' + statusClass + '">' + order.status + '</span></td>' +
                '<td>' +
                    '<button class="btn-action btn-view" onclick="event.stopPropagation(); viewOrderDetail(\'' + order.id + '\')" title="View Details"><i class="fas fa-eye"></i></button>' +
                    (order.status === 'pending' ? '<button class="btn-action btn-complete" onclick="event.stopPropagation(); markOrderComplete(\'' + order.id + '\')" title="Mark Complete"><i class="fas fa-check"></i></button>' : '') +
                    '<button class="btn-action btn-delete" onclick="event.stopPropagation(); deleteOrder(\'' + order.id + '\')" title="Delete"><i class="fas fa-trash"></i></button>' +
                '</td></tr>';
        }).join('') +
        '</tbody></table>';
}

function filterOrders() {
    var searchTerm = document.getElementById('orderSearch').value;
    var statusFilter = document.getElementById('orderStatusFilter').value;
    var dateFilter = document.getElementById('orderDateFilter').value;
    renderOrders(statusFilter, searchTerm, dateFilter);
}

function updateOrderCount() {
    orders = getOrders();
    document.getElementById('orderCount').textContent = orders.length;
}

var currentOrderId = null;

function viewOrderDetail(orderId) {
    orders = getOrders();
    var order = orders.find(function(o) { return o.id == orderId; });
    
    if (!order) return;
    
    currentOrderId = orderId;
    
    document.getElementById('detailOrderId').textContent = '#' + order.id;
    document.getElementById('detailOrderDate').textContent = new Date(order.date).toLocaleDateString();
    document.getElementById('detailCustomerName').textContent = order.customer ? order.customer.name : 'N/A';
    document.getElementById('detailCustomerEmail').textContent = order.customer ? order.customer.email : 'N/A';
    document.getElementById('detailCustomerAddress').textContent = order.customer ? order.customer.address : 'N/A';
    document.getElementById('detailPaymentMethod').textContent = order.paymentMethod || 'Cash on Delivery';
    
    var statusEl = document.getElementById('detailOrderStatus');
    statusEl.textContent = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';
    statusEl.className = 'detail-status-badge ' + (order.status || 'pending');
    
    var itemsHTML = '';
    if (order.items && order.items.length > 0) {
        itemsHTML = order.items.map(function(item) {
            return '<div class="order-item"><div class="order-item-info"><span class="order-item-img">' + (item.emoji || '📦') + '</span><span class="order-item-name">' + item.name + '</span><span class="order-item-qty">x' + item.quantity + '</span></div><span class="order-item-price">' + (item.price * item.quantity).toFixed(2) + ' DT</span></div>';
        }).join('');
    } else {
        itemsHTML = '<p>No items</p>';
    }
    
    document.getElementById('orderItemsList').innerHTML = itemsHTML;
    
    document.getElementById('detailOrderSubtotal').textContent = (order.subtotal || order.total - order.shipping || 0).toFixed(2) + ' DT';
    document.getElementById('detailOrderShipping').textContent = order.shipping === 0 ? 'FREE' : (order.shipping || 0).toFixed(2) + ' DT';
    document.getElementById('detailOrderTotal').textContent = (order.total || 0).toFixed(2) + ' DT';
    
    document.getElementById('orderDetailModal').classList.add('active');
    document.getElementById('adminOverlay').classList.add('active');
}

function printOrder() {
    orders = getOrders();
    var order = orders.find(function(o) { return o.id == currentOrderId; });
    if (!order) return;
    
    var printWindow = window.open('', '_blank');
    var itemsHtml = order.items ? order.items.map(function(item) {
        return '<tr><td>' + item.name + '</td><td>' + item.quantity + '</td><td>' + item.price.toFixed(2) + '</td><td>' + (item.price * item.quantity).toFixed(2) + '</td></tr>';
    }).join('') : '';
    
    var htmlContent = '<!DOCTYPE html><html><head><title>Order #' + order.id + '</title><style>body { font-family: Arial, sans-serif; padding: 20px; } h1 { color: #333; } .info { margin: 10px 0; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f4f4f4; } .total { font-weight: bold; font-size: 18px; }</style></head><body><h1>Order #' + order.id + '</h1><div class="info"><strong>Date:</strong> ' + new Date(order.date).toLocaleDateString() + '</div><div class="info"><strong>Customer:</strong> ' + (order.customer ? order.customer.name : 'N/A') + '</div><div class="info"><strong>Email:</strong> ' + (order.customer ? order.customer.email : 'N/A') + '</div><div class="info"><strong>Address:</strong> ' + (order.customer ? order.customer.address : 'N/A') + '</div><div class="info"><strong>Status:</strong> ' + order.status + '</div><table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>' + itemsHtml + '<tr><td colspan="3">Subtotal</td><td>' + (order.subtotal || order.total - order.shipping).toFixed(2) + ' DT</td></tr><tr><td colspan="3">Shipping</td><td>' + (order.shipping === 0 ? 'FREE' : order.shipping.toFixed(2) + ' DT') + '</td></tr><tr class="total"><td colspan="3">Total</td><td>' + order.total.toFixed(2) + ' DT</td></tr></table></body></html>';
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}

async function markOrderComplete(orderId) {
    var orderIdToComplete = orderId || currentOrderId;
    if (!orderIdToComplete) return;
    
    orders = getOrders();
    var index = orders.findIndex(function(o) { return o.id == orderIdToComplete; });
    
    if (index === -1) return;
    
    orders[index].status = 'completed';
    saveOrders(orders);
    
    if (db) {
        await updateOrderStatus(orders[index].id, 'completed');
    }
    
    closeOrderDetail();
    filterOrders();
    updateOrderCount();
    showToast('Order marked as complete!', 'success');
}

function deleteOrder(orderId) {
    var idToDelete = orderId || currentOrderId;
    
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    orders = getOrders();
    orders = orders.filter(function(o) { return o.id != idToDelete; });
    saveOrders(orders);
    
    closeOrderDetail();
    filterOrders();
    updateOrderCount();
    showToast('Order deleted successfully!', 'success');
}

function resetOrders() {
    if (!confirm('Are you sure you want to reset all orders? This will delete all orders and start fresh.')) return;
    
    localStorage.setItem('sticers_orders', JSON.stringify([]));
    
    filterOrders();
    updateOrderCount();
    showToast('All orders have been reset!', 'success');
}

function closeOrderDetail() {
    currentOrderId = null;
    document.getElementById('orderDetailModal').classList.remove('active');
    document.getElementById('adminOverlay').classList.remove('active');
}

function showTab(tabName) {
    document.getElementById('productsTab').style.display = 'none';
    document.getElementById('ordersTab').style.display = 'none';
    document.getElementById('messagesTab').style.display = 'none';
    document.getElementById('addProductTab').style.display = 'none';
    document.getElementById('analyticsTab').style.display = 'none';
    
    document.querySelectorAll('.nav-btn').forEach(function(btn) { btn.classList.remove('active'); });
    
    if (tabName === 'products') {
        document.getElementById('productsTab').style.display = 'block';
        document.querySelectorAll('.nav-btn')[0].classList.add('active');
        products = getProducts();
        renderProductsTable();
    } else if (tabName === 'orders') {
        document.getElementById('ordersTab').style.display = 'block';
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
        filterOrders();
    } else if (tabName === 'messages') {
        document.getElementById('messagesTab').style.display = 'block';
        document.querySelectorAll('.nav-btn')[2].classList.add('active');
        renderMessages();
    } else if (tabName === 'add-product') {
        document.getElementById('addProductTab').style.display = 'block';
        document.querySelectorAll('.nav-btn')[3].classList.add('active');
    } else if (tabName === 'analytics') {
        document.getElementById('analyticsTab').style.display = 'block';
        document.querySelectorAll('.nav-btn')[4].classList.add('active');
        renderVisitorStats();
        renderVisitorsTable();
        setInterval(function() {
            renderVisitorStats();
            checkForNewVisitors();
        }, 10000);
    }
}

function renderMessages() {
    var messages = JSON.parse(localStorage.getItem('stickzone_messages') || '[]');
    var messagesList = document.getElementById('messagesList');
    var totalMessages = document.getElementById('totalMessages');
    var unreadMessages = document.getElementById('unreadMessages');
    var messageCount = document.getElementById('messageCount');
    
    totalMessages.textContent = messages.length;
    var unread = messages.filter(function(m) { return m.status === 'unread'; }).length;
    unreadMessages.textContent = unread;
    messageCount.textContent = unread;
    
    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No messages yet</p>';
        return;
    }
    
    messagesList.innerHTML = messages.reverse().map(function(msg) {
        return '<div class="message-card ' + msg.status + '">' +
            '<div class="message-header">' +
                '<span class="message-name">' + msg.name + '</span>' +
                '<span class="message-date">' + msg.date + ' ' + msg.time + '</span>' +
            '</div>' +
            '<div class="message-email">' + msg.email + '</div>' +
            '<div class="message-content">' + msg.message + '</div>' +
            '<div class="message-actions">' +
                '<button class="btn btn-small" onclick="markAsRead(' + msg.id + ')">' + 
                    (msg.status === 'unread' ? 'Mark as Read' : 'Mark as Unread') + '</button>' +
                '<button class="btn btn-small btn-danger" onclick="deleteMessage(' + msg.id + ')">Delete</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

function markAsRead(messageId) {
    var messages = JSON.parse(localStorage.getItem('stickzone_messages') || '[]');
    var msg = messages.find(function(m) { return m.id === messageId; });
    if (msg) {
        msg.status = msg.status === 'unread' ? 'read' : 'unread';
        localStorage.setItem('stickzone_messages', JSON.stringify(messages));
        renderMessages();
    }
}

function deleteMessage(messageId) {
    var messages = JSON.parse(localStorage.getItem('stickzone_messages') || '[]');
    messages = messages.filter(function(m) { return m.id !== messageId; });
    localStorage.setItem('stickzone_messages', JSON.stringify(messages));
    renderMessages();
    showToast('Message deleted', 'success');
}

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

// Theme functions
function loadTheme() {
    try {
        var savedTheme = localStorage.getItem('stickzone_theme');
        var toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;
        var icon = toggleBtn.querySelector('i');
        
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } else if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch(e) { console.log('loadTheme error:', e); }
}

// Expose functions to global scope
window.handleLogin = handleLogin;
window.generateAccessCode = generateAccessCode;
window.clearAccessCode = clearAccessCode;
window.addAuthorizedUser = addAuthorizedUser;
window.removeAuthorizedUser = removeAuthorizedUser;
window.grantVisitorAccess = grantVisitorAccess;
window.revokeVisitorAccess = revokeVisitorAccess;
window.logout = logout;
window.searchProducts = searchProducts;
window.addProduct = addProduct;
window.handleImageUpload = handleImageUpload;
window.handleEditImageUpload = handleEditImageUpload;
window.clearForm = clearForm;
window.editProduct = editProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.closeEditModal = closeEditModal;
window.filterOrders = filterOrders;
window.viewOrderDetail = viewOrderDetail;
window.markOrderComplete = markOrderComplete;
window.deleteOrder = deleteOrder;
window.resetOrders = resetOrders;
window.closeOrderDetail = closeOrderDetail;
window.showTab = showTab;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;
window.renderProductsTable = renderProductsTable;
window.renderOrders = renderOrders;
window.showToast = showToast;
window.printOrder = printOrder;
window.loadTheme = loadTheme;
window.requestAdminNotificationPermission = requestAdminNotificationPermission;

function requestAdminNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                showToast('Notifications enabled!', 'success');
            }
        });
    }
}

// Initialize after DOM is ready with setTimeout to ensure all functions are defined
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try { loadTheme(); } catch(e) {}
        try { filterOrders(); } catch(e) {}
    }, 200);
});