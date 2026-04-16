import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Home } from "lucide-react";

export default function OrderConfirmedPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const isCotizacion = type === "cotizacion";
  const shortId = id ? id.slice(0, 8).toUpperCase() : "—";

  return (
    <PublicLayout>
      <div className="container max-w-lg py-20 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isCotizacion ? "¡Cotización generada!" : "¡Compra confirmada!"}
          </h1>
          <p className="text-muted-foreground">
            {isCotizacion
              ? "Tu cotización fue creada exitosamente. Podés consultarla en cualquier momento con tu email."
              : "Tu pedido fue registrado. Nos pondremos en contacto para coordinar la entrega."}
          </p>
        </div>

        <div className="rounded-xl border bg-muted/40 px-6 py-4 text-sm space-y-1">
          <p className="text-muted-foreground">Número de referencia</p>
          <p className="text-xl font-mono font-bold tracking-widest text-primary">#{shortId}</p>
        </div>

        {isCotizacion && (
          <p className="text-sm text-muted-foreground">
            Para confirmar la compra, ingresá a{" "}
            <Link to="/buscar-cotizacion" className="underline text-primary hover:text-primary/80">
              Mis Cotizaciones
            </Link>{" "}
            con el email que usaste.
          </p>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
          {isCotizacion && (
            <Button asChild>
              <Link to="/buscar-cotizacion">
                <FileText className="mr-2 h-4 w-4" /> Mis Cotizaciones
              </Link>
            </Button>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
