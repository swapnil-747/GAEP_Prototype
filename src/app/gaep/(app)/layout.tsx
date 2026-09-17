import { TopBar } from '../_components/TopBar';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="wrap fade">{children}</main>
    </>
  );
}
