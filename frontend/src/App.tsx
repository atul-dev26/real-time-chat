import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import LoginLoading from './components/Auth/LoginLoading'
import Chat from './components/Chat/Chat'
import Discover from './components/Discover/Discover'
import Notifications from './components/Notifications/Notifications'
import Groups from './components/Groups/Groups'
import Profile from './components/Profile/Profile'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/register"
        element={!currentUser ? <Register /> : <Navigate to="/" />}
      />
      <Route
        path="/loading"
        element={<LoginLoading />}
      />
      <Route
        path="/profile"
        element={currentUser ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/discover"
        element={currentUser ? <Discover /> : <Navigate to="/login" />}
      />
      <Route
        path="/notifications"
        element={currentUser ? <Notifications /> : <Navigate to="/login" />}
      />
      <Route
        path="/groups"
        element={currentUser ? <Groups /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={currentUser ? <Chat user={currentUser} /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <ThemeToggle />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
