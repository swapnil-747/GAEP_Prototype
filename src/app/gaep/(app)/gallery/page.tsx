import { GALLERY } from '@/gaep/data/content';

export default function GalleryPage() {
  return (
    <div className="fade">
      <h2 className="section-title">Shared experiments gallery</h2>
      <p className="section-sub">Work done in one team is visible and reusable by everyone &mdash; no more silos between India and the US.</p>
      <div className="divider" style={{ marginBottom: 28 }} />
      <div className="grid">
        {GALLERY.map((e) => (
          <div key={e.id} className="card">
            <div className="cat">{e.tool}</div>
            <h3>{e.title}</h3>
            <p>{e.summary}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span className="muted" style={{ fontSize: 12 }}>{e.author} &middot; {e.geo}</span>
              <span className="chip">{e.reuses} reuses</span>
            </div>
            <button className="btn ghost" style={{ marginTop: 14, width: '100%' }}>Clone &amp; reuse</button>
          </div>
        ))}
      </div>
    </div>
  );
}
