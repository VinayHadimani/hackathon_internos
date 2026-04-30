import DashboardNav from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <DashboardNav />
      <main className="md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
