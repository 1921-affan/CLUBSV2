import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Define User Type (Custom, not Supabase)
export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "club_head" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, branch: string, year: string, role?: string) => Promise<{ error: any }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize Axios and Check for Token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkUserSession();
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserSession = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Session verification failed", error);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });

      const { token, user } = response.data;

      // Save Token
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);

      // Redirect Logic
      if (user.role === 'admin') {
        setTimeout(() => navigate("/admin"), 100);
      } else if (user.role === 'club_head') {
        setTimeout(() => navigate("/dashboard"), 100);
      } else {
        setTimeout(() => navigate("/"), 100);
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || { message: "Login failed" } };
    }
  };

  const signUp = async (email: string, password: string, name: string, branch: string, year: string, role: string = 'student') => {
    try {
      // Default to 'student' if not specified. 
      // Note: Admin/Club Head creation rules are enforced by backend policies (Single Admin, etc.)
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        email,
        password,
        name,
        role,
        branch,
        year_of_study: year
      });

      // Auto-login after register? Or ask to login?
      // Let's ask to login for simplicity, or we could handle token return if backend supports it.
      // Current backend register returns userId but no token.

      // For now, return success
      return { error: null };

    } catch (error: any) {
      return { error: error.response?.data || { message: "Registration failed" } };
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
