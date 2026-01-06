import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X, LayoutDashboard, ShieldCheck, User } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
export function Navbar() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derived state from user object
  const userName = user?.name || "User";
  const isAdmin = user?.role === 'admin';
  const isClubHead = user?.role === 'club_head';

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/clubs", label: "Clubs" },
    { to: "/events", label: "Events" },
    { to: "/announcements", label: "Announcements" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TheClubs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  isActive(link.to)
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isClubHead && (
              <Link
                to="/dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                  isActive("/dashboard")
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                  isActive("/admin")
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{userName}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg font-medium transition-all",
                    isActive(link.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isClubHead && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                    isActive("/dashboard")
                      ? "bg-secondary text-secondary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                    isActive("/admin")
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userName}</span>
              </Link>
              <Button
                variant="destructive"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="gap-2 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
