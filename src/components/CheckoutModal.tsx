import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Zap, Store, Banknote, CheckCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { saveOrder } from "@/lib/firebase";
import { toast } from "sonner";

const CheckoutModal = () => {
  const { cart, isCheckoutOpen, setCheckoutOpen, cartTotal, clearCart } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [shipping, setShipping] = useState<"standard" | "express" | "pickup">("standard");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cartTotal();
  const shippingCost = shipping === "express" ? 8 : 0;
  const total = subtotal + shippingCost;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems < 20) {
      toast.error("Minimum order is 20 stickers!");
      return;
    }
    setSubmitting(true);
    try {
      const order = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customer: { name, email, address },
        items: cart.map((item) => ({ ...item })),
        subtotal,
        shipping: shippingCost,
        total,
        paymentMethod: "Cash on Delivery",
        status: "pending",
      };
      await saveOrder(order);
      setSuccess(true);
      clearCart();
    } catch {
      toast.error("Error placing order. Please try again.");
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setCheckoutOpen(false);
    setSuccess(false);
    setName("");
    setEmail("");
    setAddress("");
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-card rounded-2xl border border-border z-50 overflow-y-auto max-h-[90vh]"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-3xl text-foreground">
                  {success ? "Order Placed!" : "Checkout"}
                </h2>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
                  <h3 className="font-display text-2xl text-foreground mb-2">Thank You!</h3>
                  <p className="text-muted-foreground mb-2">
                    You will pay <strong className="text-primary">{total.toFixed(2)} DT</strong> in cash on delivery.
                  </p>
                  <p className="text-sm text-muted-foreground">A confirmation has been sent to your email.</p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-8 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Shipping</label>
                    <div className="mt-2 space-y-2">
                      {[
                        { value: "standard" as const, icon: Truck, label: "Standard", time: "3-5 days", price: "FREE" },
                        { value: "express" as const, icon: Zap, label: "Express", time: "1-2 days", price: "8.00 DT" },
                        { value: "pickup" as const, icon: Store, label: "Store Pickup", time: "Pick up", price: "FREE" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            shipping === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value={opt.value}
                            checked={shipping === opt.value}
                            onChange={() => setShipping(opt.value)}
                            className="hidden"
                          />
                          <opt.icon className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-foreground text-sm">{opt.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{opt.time}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{opt.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Payment</label>
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5">
                      <Banknote className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Cash on Delivery</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="text-foreground">{subtotal.toFixed(2)} DT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span className="text-foreground">{shippingCost === 0 ? "FREE" : `${shippingCost.toFixed(2)} DT`}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total:</span>
                      <span className="text-primary">{total.toFixed(2)} DT</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-semibold disabled:opacity-50 hover:scale-[1.02] transition-transform"
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
