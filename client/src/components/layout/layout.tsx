import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
