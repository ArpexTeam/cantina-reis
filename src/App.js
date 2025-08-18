import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import CardapioPage from './pages/CardapioPage';
import BagPage from './pages/BagPage';
import InfoPage from './pages/infoPage';
import Footer from './componentes/footer';
import ProdutoIndividual from './pages/IndividualPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminVendas from './pages/admin/AdminVendas';
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes';
import SearchPage from './pages/SearchPage';
import AgendamentoPage from './pages/AgendamentoPage';
import Login from './pages/admin/Login';
import AdminNFePage from './pages/admin/AdminNFePage';


import { AuthProvider } from './AuthContext';
import PrivateRoute from './PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{backgroundColor:'#F1F1F1'}}>
          <main className="main-content" style={{backgroundColor:'#F2F2F2'}}>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<HomeScreen />} />
              <Route path="/cardapio" element={<CardapioPage />} />
              <Route path="/sacola" element={<BagPage />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/individual/:id" element={<ProdutoIndividual />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/agendar" element={<AgendamentoPage />} />
              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/adminProducts"
                element={
                  <PrivateRoute>
                    <AdminProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/adminPedidos"
                element={
                  <PrivateRoute>
                    <AdminPedidos />
                  </PrivateRoute>
                }
              />
              <Route
                path="/adminVendas"
                element={
                  <PrivateRoute>
                    <AdminVendas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/adminConfiguracoes"
                element={
                  <PrivateRoute>
                    <AdminConfiguracoes />
                  </PrivateRoute>
                }
              />
              <Route
                 path="/adminNFE"
                element={
                <PrivateRoute>
                  <AdminNFePage />
                </PrivateRoute>} />

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
