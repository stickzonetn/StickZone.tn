import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCDnZPBaBpg9FaYOIhgENrvvieLK49OTeI",
  authDomain: "notifications-61cf3.firebaseapp.com",
  projectId: "notifications-61cf3",
  storageBucket: "notifications-61cf3.firebasestorage.app",
  messagingSenderId: "457476846801",
  appId: "1:457476846801:web:4650aae7af87bcd650c1f0",
  measurementId: "G-5MJCBDEG5Y",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Products
export async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map((d) => {
      const data = d.data();
      data.id = Number(d.id);
      return data as Product;
    });
  } catch (e) {
    console.error("Error loading products:", e);
    const stored = localStorage.getItem("sticers_products");
    if (stored) return JSON.parse(stored) as Product[];
    return [];
  }
}

export function onProductsChange(callback: (products: Product[]) => void) {
  return onSnapshot(collection(db, "products"), (snapshot) => {
    const products = snapshot.docs.map((d) => {
      const data = d.data();
      data.id = Number(d.id);
      return data as Product;
    });
    callback(products);
  });
}

export async function saveProduct(product: Product) {
  await setDoc(doc(db, "products", product.id.toString()), product);
}

export async function updateProduct(productId: number, data: Partial<Product>) {
  await updateDoc(doc(db, "products", productId.toString()), data);
}

export async function deleteProduct(productId: number) {
  await deleteDoc(doc(db, "products", productId.toString()));
}

// Orders
export async function loadOrders() {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    return snapshot.docs.map((d) => {
      const data = d.data();
      data.id = d.id;
      return data as Order;
    });
  } catch (e) {
    console.error("Error loading orders:", e);
    return JSON.parse(localStorage.getItem("sticers_orders") || "[]") as Order[];
  }
}

export function onOrdersChange(callback: (orders: Order[]) => void) {
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const orders = snapshot.docs.map((d) => {
      const data = d.data();
      data.id = d.id;
      return data as Order;
    });
    callback(orders);
  });
}

export async function saveOrder(order: Order) {
  await setDoc(doc(db, "orders", order.id), order);
  // Save notification
  await addDoc(collection(db, "notifications"), {
    orderId: order.id,
    customerName: order.customer.name,
    total: order.total,
    message: `Order #${order.id} - ${order.total.toFixed(2)} DT from ${order.customer.name}`,
    read: false,
    createdAt: serverTimestamp(),
  });
  // Push notification trigger
  await addDoc(collection(db, "pushNotifications"), {
    notification: {
      title: "New Order Received!",
      body: `Order #${order.id} - ${order.total.toFixed(2)} DT from ${order.customer.name}`,
      icon: "/logo.png",
    },
    orderId: order.id,
    createdAt: serverTimestamp(),
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  await updateDoc(doc(db, "orders", orderId), { status });
}

export async function deleteOrderFromFirebase(orderId: string) {
  await deleteDoc(doc(db, "orders", orderId));
}

// Messages
export async function loadMessages() {
  try {
    const snapshot = await getDocs(collection(db, "messages"));
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Message[];
  } catch {
    return JSON.parse(localStorage.getItem("stickzone_messages") || "[]");
  }
}

export async function saveMessage(message: Omit<Message, "id">) {
  await addDoc(collection(db, "messages"), {
    ...message,
    timestamp: serverTimestamp(),
  });
}

// Categories
export async function loadCategories() {
  try {
    const snapshot = await getDocs(collection(db, "categories"));
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => {
        const data = d.data();
        data.id = Number(d.id);
        return data as Category;
      });
    }
  } catch {}
  return getDefaultCategories();
}

export async function saveCategory(cat: Category) {
  await setDoc(doc(db, "categories", cat.id.toString()), cat);
}

export async function deleteCategoryFromFirebase(catId: number) {
  await deleteDoc(doc(db, "categories", catId.toString()));
}

// FCM
export async function initMessaging() {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export async function requestFCMToken(vapidKey: string) {
  const messaging = await initMessaging();
  if (!messaging) return null;

  try {
    const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (e) {
    console.error("Error getting FCM token:", e);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  initMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, callback);
    }
  });
}

export function onPushNotifications(callback: (data: any) => void) {
  return onSnapshot(collection(db, "pushNotifications"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        callback(data);
        deleteDoc(change.doc.ref);
      }
    });
  });
}

// Defaults
function getDefaultCategories(): Category[] {
  return [
    { id: 1, name: "cartoon", icon: "Smile" },
    { id: 2, name: "nature", icon: "Leaf" },
    { id: 3, name: "quote", icon: "Quote" },
    { id: 4, name: "abstract", icon: "Palette" },
    { id: 5, name: "animal", icon: "PawPrint" },
    { id: 6, name: "food", icon: "UtensilsCrossed" },
    { id: 7, name: "travel", icon: "Plane" },
    { id: 8, name: "sports", icon: "Trophy" },
    { id: 9, name: "music", icon: "Music" },
    { id: 10, name: "tech", icon: "Laptop" },
    { id: 11, name: "holiday", icon: "Gift" },
  ];
}

// Types
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  badge?: string | null;
  image?: string | null;
  emoji?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  time: string;
  status: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export { db, app };
