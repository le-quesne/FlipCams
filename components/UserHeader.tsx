"use client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function UserHeader() {
  const { user, userEmail, signOut } = useAuth();
  const loggedIn = !!user;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${loggedIn ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
          }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${loggedIn ? "bg-green-500" : "bg-red-500"}`}
        />
        {loggedIn ? userEmail || "Autenticado" : "No autenticado"}
      </span>
      {loggedIn ? (
        <button
          onClick={signOut}
          className="rounded-full border border-gray-200 dark:border-white/10 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          Salir
        </button>
      ) : null}
    </div>
  );
}
