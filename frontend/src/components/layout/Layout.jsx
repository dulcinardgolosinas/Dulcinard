import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsappButton } from "./WhatsappButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { CartDrawer } from "../cart/CartDrawer";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { usePageHeroStore } from "../../store/pageHeroStore";

export function Layout() {
  const fetchConfig = useSiteConfigStore((s) => s.fetchConfig);
  const fetchHeroes = usePageHeroStore((s) => s.fetchAll);

  useEffect(() => {
    fetchConfig();
    fetchHeroes();
  }, [fetchConfig, fetchHeroes]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <WhatsappButton />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
