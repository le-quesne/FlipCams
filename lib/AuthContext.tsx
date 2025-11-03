"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  userEmail: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    async function checkAuth() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userEmail = user?.email ?? user?.id ?? null;

  return (
    <AuthContext.Provider value={{ user, userEmail, loading, signOut }}>
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
