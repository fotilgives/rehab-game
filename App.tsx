import React, { Suspense, lazy, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import HomeSections from './components/HomeSections';
import PoolGame from './components/PoolGame';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import ExchangeModal from './components/ExchangeModal';
import Background from './components/Background';
import About from './components/pages/About';
import Services from './components/pages/Services';
import Prizes from './components/pages/Prizes';
import Philosophy from './components/pages/Philosophy';
import { useAccount } from './hooks/useAccount';
import { useRoute, navigate } from './hooks/useRoute';

const ChatWidget = lazy(() => import('./components/ChatWidget'));

const App: React.FC = () => {
  const account = useAccount();
  const route = useRoute();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const openExchange = () => setExchangeOpen(true);

  React.useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    // Force top scroll on next animation frame in case DOM is still rendering
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [route]);

  return (
    <div className="min-h-screen text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Background />
      <Navbar balance={account.balance} route={route} onExchange={openExchange} />

      {route === 'home' && (
        <main>
          <Hero onPlay={() => navigate('game')} onExchange={openExchange} />
          <HowItWorks />
          <HomeSections account={account} onExchange={openExchange} />
        </main>
      )}

      {route === 'game' && (
        <main>
          <PoolGame account={account} onTopUp={openExchange} />
          <Leaderboard account={account} />
        </main>
      )}

      {route === 'about' && <About />}
      {route === 'services' && <Services />}
      {route === 'prizes' && <Prizes account={account} onTopUp={openExchange} />}
      {route === 'philosophy' && <Philosophy />}

      <Footer />

      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} account={account} />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
};

export default App;
