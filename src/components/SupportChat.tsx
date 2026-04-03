import { useState } from "react";
import { MessageCircle, Send, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveMessage } from "@/lib/firebase";

interface ChatMsg {
  text: string;
  isUser: boolean;
}

const SupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { text: "👋 Hi! Welcome to StickZone! How can we help you today?", isUser: false },
  ]);
  const [input, setInput] = useState("");

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, isUser: true }]);
    setInput("");

    try {
      await saveMessage({
        name: "Chat User",
        email: "chat@customer.com",
        message: userMsg,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: "unread",
      });
    } catch {}

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Thank you for your message! 💜 Our team will get back to you soon.", isUser: false },
      ]);
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full gradient-hero shadow-glow hover:scale-110 transition-transform"
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <MessageCircle className="h-6 w-6 text-primary-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-40 w-80 bg-card rounded-2xl border border-border shadow-elevated overflow-hidden"
          >
            <div className="p-4 gradient-hero flex items-center justify-between">
              <span className="font-display text-lg text-primary-foreground">Support Chat</span>
              <button onClick={() => setOpen(false)}>
                <ChevronDown className="h-5 w-5 text-primary-foreground" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                      msg.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none"
              />
              <button type="submit" className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;
