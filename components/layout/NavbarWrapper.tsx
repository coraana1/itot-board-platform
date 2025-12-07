/**
 * NavbarWrapper.tsx – Client-Wrapper für die Navbar
 * 
 * Ermöglicht das dynamische Laden der Navbar ohne SSR.
 */

"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("./Navbar"), {
  ssr: false,
  loading: () => (
    <nav className="bg-white border-b border-gray-200 h-14" />
  ),
});

export default function NavbarWrapper() {
  return <Navbar />;
}
