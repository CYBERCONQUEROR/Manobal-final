import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation
import { Menu, X, Moon, Sun, Brain, Calendar, Users, BookOpen, Shield, LogOut, Palette, UserCircle } from 'lucide-react'; // Import UserCircle
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps { /* No props needed for routing here anymore */ }

export default function Navigation({}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false); // State for theme picker
  const { theme, setTheme } = useTheme(); // Use setTheme instead of toggleTheme
  const { user, logout } = useAuth();
  const location = useLocation(); // Get current location for active link styling

  const navItems = [
    { id: 'home', label: 'Home', icon: Brain, path: '/' }, // Added path
    { id: 'booking', label: 'Book Session', icon: Calendar, path: '/booking' }, // Added path
    { id: 'community', label: 'Community', icon: Users, path: '/community' }, // Added path
    { id: 'resources', label: 'Resources', icon: BookOpen, path: '/resources' }, // Added path
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Shield, path: '/admin' }] : []) // Added path
  ];

  const themes = [
    { key: 'light', label: 'Light', class: 'bg-gray-100 text-gray-800' },
    { key: 'dark', label: 'Dark', class: 'bg-gray-800 text-gray-100' },
    { key: 'purple-dark', label: 'Purple Dark', class: 'bg-purple-900 text-purple-100' },
    { key: 'blue-light', label: 'Blue Light', class: 'bg-blue-100 text-blue-800' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Manobal
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/home');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Select theme"
              >
                <Palette className="w-4 h-4" />
              </button>
              {showThemePicker && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                  {themes.map(t => (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTheme(t.key as any); // Cast to any to bypass ThemeKey issue temporarily
                        setShowThemePicker(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${theme === t.key ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/home');
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsOpen(false)} // Close mobile menu on navigation
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}