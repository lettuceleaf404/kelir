import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import Navbar, { Footer, TabBar } from './components/Navbar.jsx';
import { Spinner } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Watch from './pages/Watch.jsx';
import Detail from './pages/Detail.jsx';
import Player from './pages/Player.jsx';
import Collection from './pages/Collection.jsx';
import CollectionDetail from './pages/CollectionDetail.jsx';
import Profile from './pages/Profile.jsx';
import Premium from './pages/Premium.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Contents from './pages/admin/Contents.jsx';
import ContentForm from './pages/admin/ContentForm.jsx';
import Users from './pages/admin/Users.jsx';
import Reviews from './pages/admin/Reviews.jsx';
import Payments from './pages/admin/Payments.jsx';

function Shell() {
  return (
    <>
      <a href="#main" className="skip-link">Langsung ke konten</a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <TabBar />
    </>
  );
}

function RequireAuth({ admin = false, children }) {
  const { user, loading, signedOut } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return signedOut ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/** Login and register: once signed in, go back where the user came from (admins land on the admin panel). */
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return children;
  return <Navigate to={location.state?.from || (user.role === 'admin' ? '/admin' : '/')} replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Spinner label="Membuka KELIR…" />;
  return (
    <Routes>
      <Route path="/play/:slug" element={<Player />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="watch" element={<Watch />} />
        <Route path="title/:slug" element={<Detail />} />
        <Route path="collection" element={<Collection />} />
        <Route path="collection/:id" element={<RequireAuth><CollectionDetail /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="premium" element={<Premium />} />
        <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="contents" element={<Contents />} />
          <Route path="contents/new" element={<ContentForm />} />
          <Route path="contents/:id" element={<ContentForm />} />
          <Route path="users" element={<Users />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="payments" element={<Payments />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
