import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/useDebounce";
import { useCart } from "@/lib/cart";
import { formatARS } from "@/lib/format";
import { PublicLayout } from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ShoppingCart, ArrowRight, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import heroBackground from "@/assets/hero-concrete.jpeg";


export default function CatalogPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  
  const [sortBy, setSortBy] = useState("nombre");
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const debouncedSearch = useDebounce(search);
  const addItem = useCart((s) => s.addItem);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, val: number, max: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(val, max)) }));
  };

  useEffect(() => {
    supabase.from("categorias").select("id, nombre").then(({ data }) => setCategorias(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from("vw_catalogo_vigente_img").select("*");
    if (debouncedSearch) {
      const term = debouncedSearch.replace(/[%_]/g, "\\$&");
      query = query.or(`producto.ilike.%${term}%,sku_norm.ilike.%${term}%`);
    }
    if (catFilter !== "all") query = query.eq("categoria", catFilter);
    
    if (sortBy === "precio_asc") query = query.order("precio_venta", { ascending: true });
    else if (sortBy === "precio_desc") query = query.order("precio_venta", { ascending: false });
    else query = query.order("producto");

    query.then(({ data, error }) => {
      if (error) {
        toast.error("Error al cargar el catálogo. Intentá de nuevo.");
        setProductos([]);
        setLoading(false);
        return;
      }
      setProductos(data || []);
      setLoading(false);
    });
  }, [debouncedSearch, catFilter, sortBy]);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary" style={{ minHeight: "340px" }}>
        {/* Background image with stronger overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

        {/* Content */}
        <div className="container relative z-10 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-foreground/60 mb-3">
              Catálogo Online
            </p>
            <h1
              className="text-5xl md:text-7xl font-heading font-extrabold uppercase leading-none tracking-tight text-white mb-4"
              style={{ letterSpacing: "-0.01em" }}
            >
              Materiales<br />
              <span className="text-primary" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
                de Obra
              </span>
            </h1>
            <p className="text-primary-foreground/75 text-base md:text-lg mb-8 max-w-md">
              Cotizá y comprá directamente desde el catálogo. Precios actualizados, stock en tiempo real.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/carrito">
                <Button variant="secondary" size="lg" className="font-semibold">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Ver Carrito
                </Button>
              </Link>
              <Link to="/buscar-cotizacion">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold"
                >
                  Mis Cotizaciones <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container py-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((c) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre A-Z</SelectItem>
              <SelectItem value="precio_asc">Precio ↑</SelectItem>
              <SelectItem value="precio_desc">Precio ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Grid */}
      <section className="container pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6 h-48" /></Card>
            ))}
          </div>
        ) : productos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No se encontraron productos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productos.map((p) => {
              return (
                <Card key={p.producto_id} className="rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-primary/20">
                  {/* Product image */}
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt={p.producto}
                      className="w-full aspect-square object-contain rounded-t-2xl bg-white p-4"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement!;
                        e.currentTarget.remove();
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full aspect-square rounded-t-2xl bg-white flex items-center justify-center text-sm text-muted-foreground';
                        fallback.textContent = 'Sin imagen';
                        parent.prepend(fallback);
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-t-2xl bg-white flex items-center justify-center text-sm text-muted-foreground">
                      Sin imagen
                    </div>
                  )}

                  <CardContent className="p-5 flex flex-col gap-2">
                    <div>
                      <h3 className="font-semibold text-[15px] leading-snug text-foreground line-clamp-2">{p.producto}</h3>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono tracking-wide">{p.sku_norm}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">{p.categoria}</p>

                    <div className="mt-auto pt-3 border-t border-border/40 space-y-3">
                      <div className="flex items-end justify-between">
                        <p className="text-xs text-muted-foreground">
                          Stock: {p.stock} {p.unidad_medida}
                          {p.stock < 20 && (
                            <Badge variant="destructive" className="text-[9px] ml-2 align-middle">Bajo</Badge>
                          )}
                        </p>
                        <p className="text-2xl font-bold tracking-tight text-primary">{formatARS(p.precio_venta)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-primary/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-lg rounded-r-none"
                            aria-label={`Reducir cantidad de ${p.producto}`}
                            disabled={getQty(p.producto_id) <= 1}
                            onClick={() => setQty(p.producto_id, getQty(p.producto_id) - 1, p.stock)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium" aria-label={`Cantidad seleccionada: ${getQty(p.producto_id)}`}>{getQty(p.producto_id)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-lg rounded-l-none"
                            aria-label={`Aumentar cantidad de ${p.producto}`}
                            disabled={getQty(p.producto_id) >= p.stock}
                            onClick={() => setQty(p.producto_id, getQty(p.producto_id) + 1, p.stock)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          className="flex-1 rounded-lg"
                          disabled={p.stock <= 0}
                          onClick={() => {
                            const qty = getQty(p.producto_id);
                            for (let i = 0; i < qty; i++) {
                            addItem({
                              producto_id: p.producto_id,
                              nombre: p.producto,
                              sku: p.sku_norm,
                              precio_unitario: p.precio_venta,
                              stock_disponible: p.stock,
                              imagen_url: p.imagen_url,
                            });
                            }
                            setQty(p.producto_id, 1, p.stock);
                            toast.success(`${qty} item(s) agregado(s) al carrito`);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
