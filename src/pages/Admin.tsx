import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box, ShoppingBag, Mail, Tags, PlusCircle, BarChart3,
  LogOut, Search, Edit, Trash2, Check, Bell,
  Printer, X,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  loadProducts, loadOrders, loadMessages, loadCategories,
  saveProduct, updateProduct as updateProductFB, deleteProduct as deleteProductFB,
  updateOrderStatus, deleteOrderFromFirebase,
  saveCategory, deleteCategoryFromFirebase,
  requestFCMToken, onPushNotifications, onForegroundMessage,
  type Product, type Order, type Message, type Category,
} from "@/lib/firebase";
import { toast } from "sonner";

const ADMIN_CREDENTIALS = { username: "pablo", password: "pablo1102" };
const VAPID_KEY = "BIJImK19REAXSKC7s8hOGIzQ904lIOmOTdXUOeUkxcCJF2T2AlFsvGkLhTsRFJXuQfekIWs32vLuPXj0XMIpGCY";

const Admin = () => {
  const { isAdminLoggedIn, setAdminLoggedIn, products, setProducts, orders, setOrders, categories, setCategories, messages, setMessages } = useStore();
  const [tab, setTab] = useState("products");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminLoggedIn) loadData();
  }, [isAdminLoggedIn]);

  // Listen for Firestore-based push notifications (works when admin page is open)
  useEffect(() => {
    if (isAdminLoggedIn) {
      const unsub = onPushNotifications((data) => {
        if (data.notification) {
          toast.success(data.notification.body || "New order received!");
          // Show native browser notification even when tab is in foreground
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(data.notification.title, {
              body: data.notification.body,
              icon: "/logo.png",
            });
          }
        }
      });
      return () => unsub();
    }
  }, [isAdminLoggedIn]);

  // Listen for FCM foreground messages
  useEffect(() => {
    if (isAdminLoggedIn) {
      onForegroundMessage((payload) => {
        toast.success(payload?.notification?.body || "New notification!");
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(payload?.notification?.title || "StickZone", {
            body: payload?.notification?.body || "New notification",
            icon: "/logo.png",
          });
        }
      });
    }
  }, [isAdminLoggedIn]);

  const loadData = async () => {
    const [p, o, m, c] = await Promise.all([loadProducts(), loadOrders(), loadMessages(), loadCategories()]);
    setProducts(p);
    setOrders(o);
    setMessages(m);
    setCategories(c);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const accessCode = localStorage.getItem("stickzone_access_code");
    if ((password === accessCode && accessCode) || (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password)) {
      setAdminLoggedIn(true);
      localStorage.setItem("stickzone_current_user", username || "admin");
      requestNotifications();
    } else {
      toast.error("Invalid credentials");
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return;
    }
    
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const token = await requestFCMToken(VAPID_KEY);
        if (token) {
          localStorage.setItem("admin_fcm_token", token);
          toast.success("Push notifications enabled! You'll receive alerts even when the browser is closed.");
        }
      } else {
        toast.error("Notification permission denied. Enable it in browser settings.");
      }
    } else if (Notification.permission === "granted") {
      const token = await requestFCMToken(VAPID_KEY);
      if (token) {
        localStorage.setItem("admin_fcm_token", token);
        toast.success("Push notifications are active!");
      }
    } else {
      toast.error("Notifications are blocked. Please enable them in your browser settings.");
    }
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    navigate("/admin");
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-elevated"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
              <Box className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl text-foreground">Admin Login</h2>
            <p className="text-muted-foreground text-sm mt-1">Enter credentials to access the panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold hover:scale-[1.02] transition-transform">Login</button>
          </form>
          <a href="/" className="block text-center text-sm text-muted-foreground hover:text-primary mt-4">← Back to Store</a>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "products", label: "Products", icon: Box },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: orders.filter((o) => o.status === "pending").length },
    { id: "messages", label: "Messages", icon: Mail, badge: messages.filter((m) => m.status === "unread").length },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "add-product", label: "Add Product", icon: PlusCircle },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="StickZone" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-xl text-primary">StickZone Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={requestNotifications} className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-colors" title="Enable Notifications">
              <Bell className="h-5 w-5 text-foreground" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-card/50 border-b border-border overflow-x-auto">
        <div className="container mx-auto px-4 flex gap-1 py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {tab === "products" && <ProductsTab products={products} setProducts={setProducts} />}
        {tab === "orders" && <OrdersTab orders={orders} setOrders={setOrders} />}
        {tab === "messages" && <MessagesTab messages={messages} setMessages={setMessages} />}
        {tab === "categories" && <CategoriesTab categories={categories} setCategories={setCategories} />}
        {tab === "add-product" && <AddProductTab categories={categories} products={products} setProducts={setProducts} />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
};

const ProductsTab = ({ products, setProducts }: { products: Product[]; setProducts: (p: Product[]) => void }) => {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProductFB(id);
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Error deleting product");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-foreground">Product Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary capitalize">{p.category}</span></td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.price.toFixed(2)} DT</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No products</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <EditProductModal product={editing} onClose={() => setEditing(null)} products={products} setProducts={setProducts} />}
    </div>
  );
};

const EditProductModal = ({ product, onClose, products, setProducts }: { product: Product; onClose: () => void; products: Product[]; setProducts: (p: Product[]) => void }) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(product.price.toString());
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice?.toString() || "");
  const [description, setDescription] = useState(product.description);
  const [badge, setBadge] = useState(product.badge || "");
  const [image, setImage] = useState(product.image || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...product, name, category, price: parseFloat(price), originalPrice: originalPrice ? parseFloat(originalPrice) : null, description, badge: badge || null, image: image || null };
    try {
      await updateProductFB(product.id, updated);
      setProducts(products.map((p) => (p.id === product.id ? updated : p)));
      toast.success("Product updated");
      onClose();
    } catch { toast.error("Error updating"); }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-2xl text-foreground">Edit Product</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="text-sm font-medium text-foreground">Name</label><input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
          <div><label className="text-sm font-medium text-foreground">Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-foreground">Price (DT)</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
            <div><label className="text-sm font-medium text-foreground">Original Price</label><input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground">Image</label><input type="file" accept="image/*" onChange={handleImage} className="mt-1 w-full text-sm text-muted-foreground" /></div>
          <div><label className="text-sm font-medium text-foreground">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none resize-none" /></div>
          <div><label className="text-sm font-medium text-foreground">Badge</label>
            <select value={badge} onChange={(e) => setBadge(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none">
              <option value="">None</option><option value="Bestseller">Bestseller</option><option value="Popular">Popular</option><option value="Sale">Sale</option><option value="New">New</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold">Update Product</button>
        </form>
      </div>
    </div>
  );
};

const OrdersTab = ({ orders, setOrders }: { orders: Order[]; setOrders: (o: Order[]) => void }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => !search || o.customer?.name?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const markComplete = async (id: string) => {
    try {
      await updateOrderStatus(id, "completed");
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: "completed" } : o)));
      toast.success("Order marked complete");
    } catch { toast.error("Error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      await deleteOrderFromFirebase(id);
      setOrders(orders.filter((o) => o.id !== id));
      toast.success("Order deleted");
    } catch { toast.error("Error"); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Revenue", value: `${totalRevenue.toFixed(2)} DT` },
          { label: "Pending", value: pending },
          { label: "Completed", value: completed },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">#{o.id.slice(-6)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{o.customer?.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{(o.total || 0).toFixed(2)} DT</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.status === "pending" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setViewing(o)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Search className="h-4 w-4" /></button>
                      {o.status === "pending" && (
                        <button onClick={() => markComplete(o.id)} className="p-1.5 rounded-lg hover:bg-success/10 text-success"><Check className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {viewing && <OrderDetailModal order={viewing} onClose={() => setViewing(null)} onComplete={markComplete} />}
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onComplete }: { order: Order; onClose: () => void; onComplete: (id: string) => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-2xl text-foreground">Order #{order.id}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "pending" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{order.status}</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-foreground">{order.customer?.name}</p></div>
          <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{order.customer?.email}</p></div>
          <div><p className="text-muted-foreground">Address</p><p className="font-medium text-foreground">{order.customer?.address}</p></div>
          <div><p className="text-muted-foreground">Date</p><p className="font-medium text-foreground">{new Date(order.date).toLocaleDateString()}</p></div>
        </div>
        <div className="border-t border-border pt-4">
          <p className="font-medium text-foreground mb-2">Items</p>
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="text-foreground">{item.name} x{item.quantity}</span>
              <span className="text-foreground">{(item.price * item.quantity).toFixed(2)} DT</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{(order.subtotal || 0).toFixed(2)} DT</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{order.shipping === 0 ? "FREE" : `${(order.shipping || 0).toFixed(2)} DT`}</span></div>
          <div className="flex justify-between font-bold text-lg"><span className="text-foreground">Total</span><span className="text-primary">{(order.total || 0).toFixed(2)} DT</span></div>
        </div>
        <div className="flex gap-2 pt-2">
          {order.status === "pending" && (
            <button onClick={() => { onComplete(order.id); onClose(); }} className="flex-1 py-2 rounded-lg bg-success text-success-foreground font-medium text-sm flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Mark Complete
            </button>
          )}
          <button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(`<pre>${JSON.stringify(order, null, 2)}</pre>`); w.print(); } }} className="flex-1 py-2 rounded-lg bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>
    </div>
  </div>
);

const MessagesTab = ({ messages, setMessages }: { messages: Message[]; setMessages: (m: Message[]) => void }) => {
  const unread = messages.filter((m) => m.status === "unread").length;

  const toggleRead = (id: string) => {
    setMessages(messages.map((m) => m.id === id ? { ...m, status: m.status === "unread" ? "read" : "unread" } : m));
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-display text-2xl text-foreground">Messages</h2>
        <div className="flex gap-3">
          <div className="bg-card rounded-xl border border-border px-4 py-2"><span className="text-lg font-bold text-foreground">{messages.length}</span> <span className="text-xs text-muted-foreground">Total</span></div>
          <div className="bg-card rounded-xl border border-border px-4 py-2"><span className="text-lg font-bold text-primary">{unread}</span> <span className="text-xs text-muted-foreground">Unread</span></div>
        </div>
      </div>
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No messages yet</p>
        ) : (
          [...messages].reverse().map((msg) => (
            <div key={msg.id} className={`bg-card rounded-xl border p-4 ${msg.status === "unread" ? "border-primary/50" : "border-border"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-foreground">{msg.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{msg.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">{msg.date} {msg.time}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{msg.message}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => toggleRead(msg.id)} className="text-xs px-3 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80">
                  {msg.status === "unread" ? "Mark Read" : "Mark Unread"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CategoriesTab = ({ categories, setCategories }: { categories: Category[]; setCategories: (c: Category[]) => void }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const add = async () => {
    if (!name.trim()) { toast.error("Enter name"); return; }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast.error("Already exists"); return; }
    const newId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    const cat = { id: newId, name: name.toLowerCase(), icon: icon || "Tag" };
    try {
      await saveCategory(cat);
      setCategories([...categories, cat]);
      setName(""); setIcon("");
      toast.success("Category added");
    } catch { toast.error("Error"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete category?")) return;
    // Update UI immediately
    setCategories(categories.filter((c) => c.id !== id));
    toast.success("Category deleted");
    try {
      await deleteCategoryFromFirebase(id);
    } catch (e) {
      console.warn("Could not delete from Firebase (may lack permissions):", e);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-foreground mb-6">Manage Categories</h2>
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" />
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon name" className="w-32 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" />
          <button onClick={add} className="px-4 py-2 rounded-lg gradient-hero text-primary-foreground font-medium text-sm">Add</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <span className="capitalize font-medium text-foreground">{cat.name}</span>
            <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddProductTab = ({ categories, products, setProducts }: { categories: Category[]; products: Product[]; setProducts: (p: Product[]) => void }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [image, setImage] = useState("");

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const product: Product = {
      id: newId, name, category, price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      description, badge: badge || null, image: image || null,
    };
    try {
      await saveProduct(product);
      setProducts([...products, product]);
      setName(""); setCategory(""); setPrice(""); setOriginalPrice(""); setDescription(""); setBadge(""); setImage("");
      toast.success("Product added!");
    } catch { toast.error("Error adding product"); }
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-foreground mb-6">Add New Product</h2>
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 max-w-2xl space-y-4">
        <div><label className="text-sm font-medium text-foreground">Name *</label><input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
        <div>
          <label className="text-sm font-medium text-foreground">Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-foreground">Price (DT) *</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
          <div><label className="text-sm font-medium text-foreground">Original Price</label><input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none" /></div>
        </div>
        <div><label className="text-sm font-medium text-foreground">Image</label><input type="file" accept="image/*" onChange={handleImage} className="mt-1 w-full text-sm text-muted-foreground" /></div>
        <div><label className="text-sm font-medium text-foreground">Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none resize-none" /></div>
        <div><label className="text-sm font-medium text-foreground">Badge</label>
          <select value={badge} onChange={(e) => setBadge(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none">
            <option value="">None</option><option value="Bestseller">Bestseller</option><option value="Popular">Popular</option><option value="Sale">Sale</option><option value="New">New</option>
          </select>
        </div>
        <button type="submit" className="px-8 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold">Add Product</button>
      </form>
    </div>
  );
};

const AnalyticsTab = () => {
  const visitors = JSON.parse(localStorage.getItem("stickzone_visitors") || "[]");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitorsToday = visitors.filter((v: any) => new Date(v.firstVisit) >= today).length;
  const online = visitors.filter((v: any) => v.online).length;

  return (
    <div>
      <h2 className="font-display text-2xl text-foreground mb-6">Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Visitors Today", value: visitorsToday, color: "text-primary" },
          { label: "Total Visitors", value: visitors.length, color: "text-secondary" },
          { label: "Online Now", value: online, color: "text-success" },
          { label: "Page Views", value: visitors.reduce((s: number, v: any) => s + (v.pagesVisited?.length || 0), 0), color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-6">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">First Visit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Visit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {visitors.slice(0, 20).map((v: any) => (
                <tr key={v.id} className="border-b border-border">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{v.id}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{new Date(v.firstVisit).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{new Date(v.lastVisit).toLocaleTimeString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${v.online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{v.online ? "Online" : "Offline"}</span></td>
                </tr>
              ))}
              {visitors.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No visitors yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
