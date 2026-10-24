import { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '../authcontext';
import { applyTheme, loadSavedTheme } from '../frontend/Themes';
import { ProtectedRoute } from '../frontend/components/ProtectedRoute';
import { NavButtons } from '../frontend/components/NavButtons';
import { HorizontalNav } from '../frontend/components/Horizontalnav';
import { Home } from '../frontend/components/pages/home';
import Manage from '../frontend/components/pages/manage';
import { Flashcard } from '../frontend/components/flashcards';
import { Study } from '../frontend/components/pages/study';
import { Signup } from '../frontend/components/pages/signup';
import { Profile } from '../frontend/components/pages/profile';
import { Signin } from '../frontend/components/pages/signin';
import { Footer } from '../frontend/components/pages/Footer';
import { ResetPassword } from '../frontend/components/pages/resetpw';
import Subjects from '../frontend/components/SUBJECTS/components/Subjects';

const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

const NO_NAV_ROUTES = ['/signin', '/signup', '/reset-password'];

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}

function Header() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  if (NO_NAV_ROUTES.includes(pathname)) return null;
  

  if (isMobile) {
    return (
      <header className="bg-[var(--panel)]">
        <NavButtons />
      </header>
    );
  }

  return (
    <header className="bg-[var(--panel)] flex flex-col items-start pt-6 pb-3">
      <HorizontalNav />
    </header>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-fade">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/study" element={protect(<Study />)} />
        <Route path="/flashcard" element={protect(<Flashcard />)} />
        <Route path="/profile" element={protect(<Profile />)} />
        <Route path="/subjects" element={protect(<Subjects />)} />
        <Route path="/manage" element={protect(<Manage />)} />
        <Route path="*" element={<div>oh! you landed to 'OUT OF THE BOX'</div>} />
      </Routes>
    </div>
  );
}

function App() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const showBottomBar = isMobile && !NO_NAV_ROUTES.includes(pathname);

  useEffect(() => {
    applyTheme(loadSavedTheme());
  }, []);

  return (
    <div className={`Nonheader min-h-screen bg-none ${showBottomBar ? 'pb-24' : ''}`}>
      <Link to="/">
        <h1 className="titletext font-child ml-8 text-5xl">Caremelflow</h1>
      </Link>
      <AuthProvider>
        <Header />
        <AnimatedRoutes />
        <Footer />
      </AuthProvider>
    </div>
  );
}

export default App;