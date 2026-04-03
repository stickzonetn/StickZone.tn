import { motion } from "framer-motion";
import { Truck, Droplets, Star } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen flex items-center pt-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl md:text-7xl font-display leading-tight">
            Express Yourself with{" "}
            <span className="text-gradient">Custom Stickers</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg font-body">
            High-quality, waterproof stickers in various sizes and shapes. Perfect for laptops,
            phones, water bottles, and more!
          </p>
          <a
            href="#products"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-hero text-primary-foreground font-semibold text-lg shadow-glow hover:scale-105 transition-transform"
          >
            Shop Now
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 gradient-hero rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />
            <img
              src="/logo.png"
              alt="StickZone"
              className="relative w-80 h-80 md:w-96 md:h-96 object-contain animate-float drop-shadow-2xl"
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: "Free Shipping", desc: "Free delivery on all orders" },
            { icon: Droplets, title: "Waterproof", desc: "Durable & weather-resistant" },
            { icon: Star, title: "Premium Quality", desc: "Vibrant colors that last" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
