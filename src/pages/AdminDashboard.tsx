import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatARS } from "@/lib/format";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, FileText, TrendingUp, Clock, Hourglass } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DashboardKPIs {
  cantidad_ventas: number;
  facturacion_ventas: number;
  comision_ventas: number;
  cantidad_cotizaciones_pendientes: number;
  facturacion_pendiente: number;
  comision_pendiente: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? formatARS(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true);

      const [ventasRes, cotPendRes] = await Promise.all([
        supabase.from("ventas").select("total, cotizacion_id").eq("estado", "confirmada"),
        supabase.from("cotizaciones").select("id, total").eq("estado", "pendiente"),
      ]);

      const ventas = ventasRes.data || [];
      const cotPend = cotPendRes.data || [];

      const facturacionVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
      const facturacionPendiente = cotPend.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

      const calcComision = async (ids: string[]) => {
        if (ids.length === 0) return 0;
        const { data: items } = await supabase
          .from("cotizacion_items")
          .select("cantidad, subtotal, productos(precio_proveedor)")
          .in("cotizacion_id", ids);
        return (items || []).reduce((sum, it: any) => {
          const costo = Number(it.cantidad || 0) * Number(it.productos?.precio_proveedor || 0);
          const sub = Number(it.subtotal || 0);
          return sum + (sub - costo);
        }, 0);
      };

      const ventaCotIds = ventas.map((v) => v.cotizacion_id).filter(Boolean);
      const pendIds = cotPend.map((c) => c.id).filter(Boolean);

      const [comisionVentas, comisionPendiente] = await Promise.all([
        calcComision(ventaCotIds),
        calcComision(pendIds),
      ]);

      setKpis({
        cantidad_ventas: ventas.length,
        facturacion_ventas: facturacionVentas,
        comision_ventas: comisionVentas,
        cantidad_cotizaciones_pendientes: cotPend.length,
        facturacion_pendiente: facturacionPendiente,
        comision_pendiente: comisionPendiente,
      });
      setLoading(false);
    };

    fetchKPIs();
  }, []);

  const ventasCards = kpis
    ? [
        { label: "Cantidad de Ventas", value: kpis.cantidad_ventas, icon: ShoppingCart },
        { label: "Facturación Total", value: formatARS(kpis.facturacion_ventas), icon: DollarSign },
        { label: "Comisión Total", value: formatARS(kpis.comision_ventas), icon: TrendingUp, highlight: true },
      ]
    : [];

  const cotizacionesCards = kpis
    ? [
        { label: "Cotizaciones Pendientes", value: kpis.cantidad_cotizaciones_pendientes, icon: FileText },
        { label: "Facturación Pendiente", value: formatARS(kpis.facturacion_pendiente), icon: Hourglass },
        { label: "Comisión Pendiente", value: formatARS(kpis.comision_pendiente), icon: Clock, highlight: true },
      ]
    : [];

  const chartData = kpis
    ? [
        {
          name: "Ventas",
          Facturación: Math.round(kpis.facturacion_ventas),
          Comisión: Math.round(kpis.comision_ventas),
        },
        {
          name: "Pendientes",
          Facturación: Math.round(kpis.facturacion_pendiente),
          Comisión: Math.round(kpis.comision_pendiente),
        },
      ]
    : [];

  const renderCard = (c: any) => (
    <Card key={c.label} className={`shadow-sm ${c.highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
        <c.icon className={`h-5 w-5 ${c.highlight ? "text-primary" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${c.highlight ? "text-primary" : ""}`}>{c.value}</p>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-32" /></CardHeader>
            <CardContent><div className="h-8 bg-muted rounded w-24" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-xl" />
    </div>
  );

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Ventas Confirmadas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ventasCards.map(renderCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Cotizaciones Pendientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cotizacionesCards.map(renderCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Comparativa Facturación vs Comisión
            </h2>
            <Card>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                      formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
                    />
                    <Bar dataKey="Facturación" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Comisión" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
