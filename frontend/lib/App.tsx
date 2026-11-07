import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Assistant from "@/pages/Assistant";
import CreatorStudio from "@/pages/CreatorStudio";
import BusinessStudio from "@/pages/BusinessStudio";
import Workflows from "@/pages/Workflows";
import WorkflowDetail from "@/pages/WorkflowDetail";
import Integrations from "@/pages/Integrations";
import AppShell from "@/components/layout/AppShell";

// One <Route> per page in frontend/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/creator" element={<CreatorStudio />} />
        <Route path="/business" element={<BusinessStudio />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/:id" element={<WorkflowDetail />} />
        <Route path="/integrations" element={<Integrations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
