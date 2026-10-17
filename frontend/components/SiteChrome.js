"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SiteChrome({ children }) {
  const pathname = usePathname();

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  // Admin pages par public Navbar/Footer nahi
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Normal user pages
  return (
    <>
      <Navbar />

      <main>{children}</main>

      <Footer />
    </>
  );
}
