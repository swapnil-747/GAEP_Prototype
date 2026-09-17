import './gaep.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GAEP — Global Analytics Experimentation Platform',
};

export default function GaepLayout({ children }: { children: React.ReactNode }) {
  return <div className="gaep">{children}</div>;
}
