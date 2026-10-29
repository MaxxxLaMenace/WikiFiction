import { useEffect, useState, type CSSProperties } from 'react';
import { UNIVERSES } from './universes';
import UniverseSelect from './components/UniverseSelect';
import UniverseHome from './components/UniverseHome';
import Album from './components/Album';
import { AccountButton } from './auth';

// Routage par le hash : #/ (choix), #/<univers>, #/<univers>/album.
function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function App() {
  const [universeId, page] = useRoute();
  const universe = UNIVERSES.find((u) => u.id === universeId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [universeId, page]);

  if (!universe) return <UniverseSelect />;

  const themeVars = {
    '--accent': universe.theme.accent,
    '--accent-soft': universe.theme.accentSoft,
    '--universe-bg': universe.theme.background,
    '--card-back': universe.theme.cardBack,
  } as CSSProperties;

  return (
    <div className="universe" style={themeVars}>
      <header className="topbar">
        <a href="#/" className="topbar-back">← Univers</a>
        <a href={`#/${universe.id}`} className="topbar-title">{universe.name}</a>
        <nav className="topbar-nav">
          <a href={`#/${universe.id}`} className={page !== 'album' ? 'active' : ''}>Paquets</a>
          <a href={`#/${universe.id}/album`} className={page === 'album' ? 'active' : ''}>Album</a>
        </nav>
        <AccountButton />
      </header>
      <main className="content">
        {page === 'album' ? <Album universe={universe} /> : <UniverseHome universe={universe} />}
      </main>
    </div>
  );
}
