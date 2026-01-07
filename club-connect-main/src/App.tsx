import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Clubs from "./pages/Clubs";
import ClubMatchmaker from "./pages/ClubMatchmaker";
import ClubDetail from "./pages/ClubDetail";
import Events from "./pages/Events";
import Announcements from "./pages/Announcements";
import ClubDashboard from "./pages/ClubDashboard";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CreateEvent from "./pages/CreateEvent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes with MainLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/matchmaker" element={<ClubMatchmaker />} />
              <Route path="/clubs/:id" element={<ClubDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/dashboard" element={<ClubDashboard />} />
              <Route path="/create-event/:clubId" element={<CreateEvent />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
