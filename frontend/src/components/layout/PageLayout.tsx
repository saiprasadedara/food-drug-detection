import Navbar from './Navbar';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
