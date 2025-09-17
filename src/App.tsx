import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OrcamentoDecoracao from "./pages/OrcamentoDecoracao";
import OrcamentoLembrancinhas from "./pages/OrcamentoLembrancinhas";
import OrcamentoConfirmacao from "./pages/OrcamentoConfirmacao";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/orcamentos" element={<ClientDashboard />} />
        <Route path="/admin/orcamentos" element={<AdminDashboard />} />
        <Route path="/orcamento/decoracao" element={<OrcamentoDecoracao />} />
        <Route path="/orcamento/lembrancinhas" element={<OrcamentoLembrancinhas />} />
        <Route path="/orcamento/confirmacao" element={<OrcamentoConfirmacao />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </>
);

export default App;