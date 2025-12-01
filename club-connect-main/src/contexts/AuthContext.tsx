import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (roleData) {
        // User is admin, redirect to admin panel
        setTimeout(() => navigate("/admin"), 100);
      } else {
        // Check if user is a club head
        const { data: clubHeadData } = await supabase
          .from("club_members")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("role_in_club", "head")
          .limit(1)
          .maybeSingle();
        
        if (clubHeadData) {
          // User is a club head, redirect to dashboard
          setTimeout(() => navigate("/dashboard"), 100);
        } else {
          // Regular user, redirect to home
          setTimeout(() => navigate("/"), 100);
        }
      }
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        },
      },
    });

    if (!error) {
      // Send welcome email
      setTimeout(async () => {
        try {
          await supabase.functions.invoke("send-welcome-email", {
            body: {
              to: email,
              name: name,
            },
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }, 1000);
    }

    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if server-side logout fails, clear local state
      console.log("Logout error (will clear local state anyway):", error);
    } finally {
      // Always clear local state and navigate
      setSession(null);
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
