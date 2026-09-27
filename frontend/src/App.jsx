import { Routes, Route } from 'react-router-dom';
import AuthGuard from './components/guards/AuthGuard';
import RoleGuard from './components/guards/RoleGuard';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateArticle from './pages/CreateArticle';
import EditArticle from './pages/EditArticle';
import './App.css';

/**
 * ============================================================================
 * L'ARCHITECTURE DES ROUTES (La Carte du Restaurant)
 * ============================================================================
 */
function App() {
  return (
    <>
      <Navbar />
      <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<AuthGuard />}>
        <Route index element={<Dashboard />} />
        
        {/* 🔥 NOUVEAU VIDEUR (RoleGuard) : Seuls Admin et Contributor peuvent écrire/modifier ! */}
        <Route element={<RoleGuard allowedRoles={['Admin', 'Contributor']} />}>
          <Route path="create-article" element={<CreateArticle />} />
          <Route path="edit-article/:id" element={<EditArticle />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}

export default App;
