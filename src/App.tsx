import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import SearchQuotePage from "./pages/SearchQuotePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCatalog from "./pages/AdminCatalog";
import AdminPriceHistory from "./pages/AdminPriceHistory";
import AdminQuotes from "./pages/AdminQuotes";
import AdminSales from "./pages/AdminSales";
import NotFound from "./pages/NotFound";
import OrderConfirmedPage from "./pages/OrderConfirmedPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/buscar-cotizacion" element={<SearchQuotePage />} />
          <Route path="/confirmado/:type/:id" element={<OrderConfirmedPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/catalogo" element={<ProtectedRoute><AdminCatalog /></ProtectedRoute>} />
          <Route path="/admin/historial-precios" element={<ProtectedRoute><AdminPriceHistory /></ProtectedRoute>} />
          <Route path="/admin/cotizaciones" element={<ProtectedRoute><AdminQuotes /></ProtectedRoute>} />
          <Route path="/admin/ventas" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
