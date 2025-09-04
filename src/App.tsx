import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import CommunityPage from './pages/CommunityPage';
import ResourcesPage from './pages/ResourcesPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      case 'login':
        return <LoginPage onPageChange={setCurrentPage} />;
      case 'booking':
        return <BookingPage />;
      case 'community':
        return <CommunityPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          {renderPage()}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}