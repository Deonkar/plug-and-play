import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppShell from "./components/AppShell";
import Overview from "./pages/Overview";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import Context from "./pages/Context";
import CRM from "./pages/CRM";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import How from "./pages/marketing/How";
import Stack from "./pages/marketing/Stack";
import FAQ from "./pages/marketing/FAQ";
import ApiDocs from "./pages/marketing/ApiDocs";
import About from "./pages/marketing/About";
import Contact from "./pages/marketing/Contact";
import Pricing from "./pages/marketing/Pricing";

function Protected({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-muted-foreground font-mono">// authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !["super_admin", "admin"].includes(user.role))
    return <Navigate to="/app" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/how" element={<How />} />
              <Route path="/stack" element={<Stack />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/reference" element={<ApiDocs />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/app" element={<Protected><AppShell/></Protected>}>
                <Route index element={<Overview />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="users" element={<Protected adminOnly><Users /></Protected>} />
                <Route path="context" element={<Protected adminOnly><Context /></Protected>} />
                <Route path="crm" element={<Protected adminOnly><CRM /></Protected>} />
                <Route path="analytics" element={<Protected adminOnly><Analytics /></Protected>} />
                <Route path="settings" element={<Protected adminOnly><Settings /></Protected>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace/>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
