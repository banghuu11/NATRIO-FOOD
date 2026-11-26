import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/shop/cart-drawer';
import { CompareBar } from '@/components/shop/compare-bar';
import { AllergySync } from '@/components/shop/allergy-sync';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <CompareBar />
      <AllergySync />
    </>
  );
}
