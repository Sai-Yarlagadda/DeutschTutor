"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/scenarios", label: "Szenarien" },
  { href: "/conversation", label: "Gespräch" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b flex items-center justify-between px-6 py-4"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-bg-surface)",
      }}
    >
      <Link
        href="/"
        className="font-bold text-lg tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
      >
        DeutschTutor
      </Link>

      <ul className="flex gap-6 text-sm">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className="transition-colors"
                style={{
                  color: active
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
