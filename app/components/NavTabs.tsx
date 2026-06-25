"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Multi-language", href: "/multi" },
  { label: "Analyzer", href: "/" },
  { label: "Reports", href: "/reports" },
  { label: "FAQ", href: "/faq" },
];

export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav style={{ borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px", display: "flex" }}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? "#0070f3" : "#6b7280",
                borderBottom: active ? "2px solid #0070f3" : "2px solid transparent",
                textDecoration: "none",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
