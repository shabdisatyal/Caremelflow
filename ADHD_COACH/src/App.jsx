import './App.css';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '../authcontext';
import { ProtectedRoute } from '../frontend/components/ProtectedRoute';
import { NavButtons } from '../frontend/components/NavButtons';
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



function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-fade">
      <Routes location={location}>
        
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/study" element={<ProtectedRoute> <Study /> </ProtectedRoute>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/signin' element={<Signin/>} />
        <Route path='/reset-password' element={<ResetPassword/>} />
        <Route path='/flashcard' element={<ProtectedRoute><Flashcard/></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><Subjects/></ProtectedRoute>} />
      
        <Route path="/manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
        <Route path="*" element={<div>oh! you landed to 'OUT OF THE BOX' </div>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <div className="Nonheader min-h-screen bg-[#DFF1F1]">
      <AuthProvider>
        <header className="bg-white flex flex-col items-start pt-6 pb-3">
          <Link to="/">
            <h1 className="titletext font-fascinate ml-8 text-5xl">Careme⟌</h1>
          </Link>
          <NavButtons />
        </header>

        <AnimatedRoutes />

       <Footer/>
      </AuthProvider>
      
    </div>
  );
}

export default App;