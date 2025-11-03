"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/finanzas", label: "Finanzas" },
    { href: "/inventario", label: "Inventario" },
  ];

  return (
    <nav className="mb-6">
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 inline-flex">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(link.href)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
