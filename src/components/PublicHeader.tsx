import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export function PublicHeader() {
  const itemCount = useCart((s) => s.items.length);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-primary">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-foreground tracking-tight">
          Holcim SA
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Catálogo
          </Link>
          <Link to="/buscar-cotizacion" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Mis Cotizaciones
          </Link>
          <Link to="/carrito" className="relative">
            <Button variant="secondary" size="icon" className="relative" aria-label="Ver carrito de compras">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground animate-in zoom-in-50 duration-200"
                  aria-live="polite"
                  aria-label={`${itemCount} producto${itemCount !== 1 ? "s" : ""} en el carrito`}
                >
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>

        {/* Mobile: carrito + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/carrito" className="relative">
            <Button variant="secondary" size="icon" className="relative" aria-label="Ver carrito de compras">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
                  aria-live="polite"
                >
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/80"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-primary/30 bg-primary px-4 py-3 flex flex-col gap-3">
          <Link
            to="/"
            className="text-sm text-primary-foreground/80 hover:text-primary-foreground py-1"
            onClick={() => setMenuOpen(false)}
          >
            Catálogo
          </Link>
          <Link
            to="/buscar-cotizacion"
            className="text-sm text-primary-foreground/80 hover:text-primary-foreground py-1"
            onClick={() => setMenuOpen(false)}
          >
            Mis Cotizaciones
          </Link>
        </div>
      )}
    </header>
  );
}
