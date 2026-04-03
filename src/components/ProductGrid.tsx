import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { loadProducts, loadCategories, type Product } from "@/lib/firebase";

const ProductGrid = () => {
  const { products, setProducts, addToCart, categories, setCategories } = useStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProducts().then(setProducts);
    loadCategories().then(setCategories);
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sort === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, search, activeCategory, sort]);

  const handleAdd = (product: Product) => {
    addToCart(product);
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1000);
  };

  return (
    <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground">
            Our Sticker Collection
          </h2>
          <p className="mt-2 text-muted-foreground">Choose from our amazing collection</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stickers..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 rounded-xl bg-card border border-border text-foreground outline-none"
          >
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeCategory === cat.name
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated"
              >
                <div className="relative aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden p-4">
                  {product.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold gradient-accent text-secondary-foreground z-10">
                      {product.badge}
                    </span>
                  )}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-6xl">{product.emoji || "🎨"}</span>
                  )}
                </div>

                <div className="p-4">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {product.category}
                  </span>
                  <h3 className="mt-1 font-semibold text-foreground line-clamp-1">{product.name}</h3>

                  {product.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${i < Math.round(product.rating || 0) ? "text-secondary" : "text-muted-foreground/30"}`}
                        >
                          ★
                        </span>
                      ))}
                      {product.reviewCount !== undefined && (
                        <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                      )}
                    </div>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-lg font-bold text-foreground">
                        {product.price.toFixed(2)} DT
                      </span>
                      {product.originalPrice && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {product.originalPrice.toFixed(2)} DT
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        addedIds.has(product.id)
                          ? "bg-success text-success-foreground"
                          : "bg-primary text-primary-foreground hover:shadow-glow"
                      }`}
                    >
                      {addedIds.has(product.id) ? (
                        <>
                          <Check className="h-4 w-4" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No stickers found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
