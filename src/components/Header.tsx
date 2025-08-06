/**
 * Header Component
 * 
 * Navigation header with authentication controls and user menu
 * Includes sign-in button, user menu when authenticated, and theme toggle
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';
import ThemeToggle from '@/components/ThemeToggle';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { Sparkles, Menu, X } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignInClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleAccountSettings = () => {
    setIsAccountSettingsOpen(true);
  };

  const handleCloseAccountSettings = () => {
    setIsAccountSettingsOpen(false);
  };

  return (
    <>
      <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Enabl Health
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <nav className="flex items-center gap-6">
                <a 
                  href="#features" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Features
                </a>
                <a 
                  href="#agents" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  AI Agents
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  About
                </a>
              </nav>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                
                {isLoading ? (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ) : isAuthenticated ? (
                  <UserMenu onAccountSettings={handleAccountSettings} />
                ) : (
                  <button
                    onClick={handleSignInClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <nav className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#agents" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  AI Agents
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </a>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {isLoading ? (
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ) : isAuthenticated ? (
                    <UserMenu onAccountSettings={handleAccountSettings} />
                  ) : (
                    <button
                      onClick={() => {
                        handleSignInClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleCloseLoginModal} 
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        isOpen={isAccountSettingsOpen} 
        onClose={handleCloseAccountSettings} 
      />
    </>
  );
}
