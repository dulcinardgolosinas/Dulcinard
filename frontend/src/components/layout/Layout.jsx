import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsappButton } from "./WhatsappButton";
import { CartDrawer } from "../cart/CartDrawer";
import { useSiteConfigStore } from "../../store/siteConfigStore";

export function Layout() {
  const fetchConfig = useSiteConfigStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsappButton />
      <CartDrawer />
    </div>
  );
}
