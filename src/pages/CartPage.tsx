import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { formatARS } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Minus, Plus, FileText, CreditCard } from "lucide-react";

import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQty, clear, total } = useCart();
  const [mode, setMode] = useState<"idle" | "quote" | "buy">("idle");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", direccion: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [medioPago, setMedioPago] = useState("transferencia");
  const [submitting, setSubmitting] = useState(false);
  const [cotizacionResult, setCotizacionResult] = useState<any>(null);
  const navigate = useNavigate();

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.email.trim()) e.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Ingresá un email válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleField = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const getOrCreateCliente = async () => {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", form.email)
      .maybeSingle();
    if (existing) return existing.id;
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre: form.nombre, email: form.email, telefono: form.telefono, direccion: form.direccion })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  };

  const handleQuote = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const clienteId = await getOrCreateCliente();
      const { data: cot, error } = await supabase
        .from("cotizaciones")
        .insert({ cliente_id: clienteId, estado: "pendiente", total: total(), canal: "web" })
        .select()
        .single();
      if (error) throw error;
      const cotItems = items.map((i) => ({
        cotizacion_id: cot.id,
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        subtotal: i.precio_unitario * i.cantidad,
      }));
      const { error: itemsErr } = await supabase.from("cotizacion_items").insert(cotItems);
      if (itemsErr) throw itemsErr;
      clear();
      navigate(`/confirmado/cotizacion/${cot.id}`);
    } catch (e: any) {
      toast.error("Error al crear la cotización. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuy = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const clienteId = await getOrCreateCliente();
      const { data: venta, error } = await supabase
        .from("ventas")
        .insert({ cliente_id: clienteId, estado: "confirmada", total: total(), canal: "web", medio_pago: medioPago })
        .select()
        .single();
      if (error) throw error;
      const ventaItems = items.map((i) => ({
        venta_id: venta.id,
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        subtotal: i.precio_unitario * i.cantidad,
      }));
      const { error: itemsErr } = await supabase.from("venta_items").insert(ventaItems);
      if (itemsErr) throw itemsErr;
      clear();
      navigate(`/confirmado/compra/${venta.id}`);
    } catch (e: any) {
      toast.error("Error al procesar la compra. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmFromQuote = async () => {
    if (!cotizacionResult) return;
    setSubmitting(true);
    try {
      const { data: venta, error } = await supabase
        .from("ventas")
        .insert({
          cliente_id: cotizacionResult.cliente_id,
          cotizacion_id: cotizacionResult.id,
          estado: "confirmada",
          total: cotizacionResult.total,
          canal: "web",
          medio_pago: "transferencia",
        })
        .select()
        .single();
      if (error) throw error;
      const ventaItems = items.map((i) => ({
        venta_id: venta.id,
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        subtotal: i.precio_unitario * i.cantidad,
      }));
      await supabase.from("venta_items").insert(ventaItems);
      await supabase.from("cotizaciones").update({ estado: "convertida" }).eq("id", cotizacionResult.id);
      clear();
      toast.success("¡Compra confirmada desde cotización!");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message || "Error al confirmar compra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold mb-6">Carrito de Compras</h1>
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>Tu carrito está vacío.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Ir al catálogo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <Card key={item.producto_id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <img
                      src={item.imagen_url || "/placeholder.svg"}
                      alt={item.nombre}
                      className="w-16 h-16 rounded-lg object-cover bg-white flex-shrink-0"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                      <p className="text-sm font-semibold mt-1">{formatARS(item.precio_unitario)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" aria-label={`Reducir cantidad de ${item.nombre}`} onClick={() => updateQty(item.producto_id, item.cantidad - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm" aria-label={`Cantidad: ${item.cantidad}`}>{item.cantidad}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" aria-label={`Aumentar cantidad de ${item.nombre}`} onClick={() => updateQty(item.producto_id, item.cantidad + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm w-24 text-right">{formatARS(item.precio_unitario * item.cantidad)}</p>
                    <Button size="icon" variant="ghost" aria-label={`Eliminar ${item.nombre} del carrito`} onClick={() => removeItem(item.producto_id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{formatARS(total())}</p>
                  </div>

                  {mode === "idle" && (
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => setMode("quote")}>
                        <FileText className="mr-2 h-4 w-4" /> Solicitar Cotización
                      </Button>
                      <Button className="w-full" variant="secondary" onClick={() => setMode("buy")}>
                        <CreditCard className="mr-2 h-4 w-4" /> Compra Directa
                      </Button>
                    </div>
                  )}

                  {(mode === "quote" || mode === "buy") && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">{mode === "quote" ? "Datos para Cotización" : "Datos de Compra"}</h3>
                      <div className="space-y-1">
                        <label htmlFor="cart-nombre" className="text-xs font-medium text-muted-foreground">Nombre <span className="text-destructive">*</span></label>
                        <Input id="cart-nombre" placeholder="Juan García" autoComplete="name" value={form.nombre} onChange={(e) => { handleField("nombre", e.target.value); setErrors((p) => ({ ...p, nombre: "" })); }} className={errors.nombre ? "border-destructive focus-visible:ring-destructive" : ""} />
                        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="cart-email" className="text-xs font-medium text-muted-foreground">Email <span className="text-destructive">*</span></label>
                        <Input id="cart-email" placeholder="juan@empresa.com" type="email" autoComplete="email" value={form.email} onChange={(e) => { handleField("email", e.target.value); setErrors((p) => ({ ...p, email: "" })); }} className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="cart-telefono" className="text-xs font-medium text-muted-foreground">Teléfono</label>
                        <Input id="cart-telefono" placeholder="+54 11 1234-5678" autoComplete="tel" value={form.telefono} onChange={(e) => handleField("telefono", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="cart-direccion" className="text-xs font-medium text-muted-foreground">Dirección de entrega</label>
                        <Input id="cart-direccion" placeholder="Av. Corrientes 1234, CABA" autoComplete="street-address" value={form.direccion} onChange={(e) => handleField("direccion", e.target.value)} />
                      </div>
                      {mode === "buy" && (
                        <Select value={medioPago} onValueChange={setMedioPago}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full"
                          disabled={submitting}
                          onClick={mode === "quote" ? handleQuote : handleBuy}
                        >
                          {submitting ? "Procesando..." : mode === "quote" ? "Generar Cotización" : "Confirmar Compra"}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setMode("idle")}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
