import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrcamentoDetail from "./pages/AdminOrcamentoDetail";
import OrcamentoDecoracao from "./pages/OrcamentoDecoracao";
import OrcamentoLembrancinhas from "./pages/OrcamentoLembrancinhas";
import OrcamentoPresentes from "./pages/OrcamentoPresentes";
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
        <Route path="/admin/orcamentos/:id" element={<AdminOrcamentoDetail />} />
        <Route path="/orcamento/decoracao" element={<OrcamentoDecoracao />} />
        <Route path="/orcamento/lembrancinhas" element={<OrcamentoLembrancinhas />} />
        <Route path="/orcamento/presentes" element={<OrcamentoPresentes />} />
        <Route path="/orcamento/confirmacao" element={<OrcamentoConfirmacao />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </>
);

export default App;