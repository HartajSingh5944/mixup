import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthRoutes from './routes/AuthRoutes';
import AppRoutes from './routes/AppRoutes';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import MatchPage from './pages/MatchPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AdminReportsPage from './pages/AdminReportsPage';
import CreateEventPage from './pages/CreateEventPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<AuthRoutes />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<AppRoutes />}>
              <Route path="/map" element={<MapPage />} />
              <Route path="/match" element={<MatchPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/events/create" element={<CreateEventPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
