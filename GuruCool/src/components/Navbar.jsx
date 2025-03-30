import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/whitelogo.png'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleContactClick = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 w-full">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
        <div className="relative flex h-16 items-center justify-between w-full">
          <div className="flex items-center">
            {/* Hamburger Menu Button */}
            <button
              className="text-gray-400 hover:text-white focus:outline-none mr-3 sm:hidden bg-gray-800"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
            {/* Logo */}
            <div className="text-2xl font-bold text-white">
              GuruCool
              </div>
          </div>
          <div className="hidden sm:flex justify-center space-x-4 w-full">
            <a
              href="#home"
              className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
            >
              About us
            </a>
            <a
              href="#about"
              className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
            >
              Features
            </a>
            <a
              href="/anywhere"
              className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
            >
              GuruCool Anywhere
            </a>
            
          </div>
        </div>
        {/* Mobile Menu */}
        {isOpen && (
          <div className="sm:hidden px-2 pt-2 pb-3 space-y-1">
            <a
              href="#home"
              className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            >
              Home
            </a>
            <a
              href="#about"
              className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            >
              About us
            </a>
            <a
              href="#about"
              className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            >
              Features
            </a>
            <a
              onClick={handleContactClick}
              className="block text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            >
              GuruCool Anywhere
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

