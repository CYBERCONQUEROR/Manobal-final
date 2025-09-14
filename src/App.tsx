import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'; // Import routing components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import CommunityPage from './pages/CommunityPage';
import ResourcesPage from './pages/ResourcesPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage'; // Import ProfilePage

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthGuard />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate(); // For programmatic navigation

  const handlePageChange = (page: string) => {
    navigate(page);
  };

  // Redirect to /profile after Google login if display name is missing or specific fields are empty
  // useEffect(() => {
  //   if (user && user.isNewUser && user.loginMethod === 'google') { // Assuming you track new users/login method
  //     navigate('/profile');
  //   }
  // }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading application...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onPageChange={handlePageChange} />;
  }

  return (
    <div className="min-h-screen transition-colors">
      <Navigation /> {/* Navigation no longer needs currentPage or onPageChange */}
      <Routes>
        <Route path="/" element={<HomePage onPageChange={handlePageChange} />} />
        <Route path="/home" element={<HomePage onPageChange={handlePageChange} />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* New Profile Route */}
        {user.role === 'admin' && (
          <Route path="/admin" element={<AdminPage />} />
        )}
        <Route path="*" element={<HomePage onPageChange={handlePageChange} />} /> {/* Fallback route */}
      </Routes>
    </div>
  );
}