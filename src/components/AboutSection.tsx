import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display text-foreground">About StickZone</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            We're passionate about helping you express your unique personality through custom stickers.
            Founded in 2024, our mission is to bring creativity to life with premium quality stickers
            that stick (pun intended!).
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every sticker is carefully crafted using premium materials to ensure vibrant colors and
            long-lasting durability.
          </p>

          <div className="grid grid-cols-3 gap-8 mt-12">
            {[
              { number: "500+", label: "Happy Customers" },
              { number: "500+", label: "Designs" },
              { number: "4.9", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-3xl md:text-4xl font-display text-gradient">{stat.number}</span>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
