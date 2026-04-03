import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="StickZone" className="h-10 w-10 rounded-lg" />
              <span className="font-display text-2xl text-primary">StickZone</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your destination for premium custom stickers.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {["Home", "About", "Shop", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Customer Service</h3>
            <ul className="space-y-2">
              {["Shipping Info", "Returns", "FAQ", "Privacy Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">© 2024 StickZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
