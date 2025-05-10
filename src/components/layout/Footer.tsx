import { Link } from '@tanstack/react-router';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-primary text-white py-10 px-6">
      <div className="container mx-auto">
        {/* Logo and Name */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          <img
            src="/images/logo.ico"
            alt="Sistema de Monitorias"
            className="h-14 w-14"
          />
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold">SISTEMA DE MONITORIAS</h3>
            <p className="text-sm">INSTITUTO DE COMPUTAÇÃO UFBA</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center items-center gap-6 mb-8">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/" className="hover:underline">
            About
          </Link>
          <Link to="/" className="hover:underline">
            Services
          </Link>
          <Link to="/" className="hover:underline">
            Get in touch
          </Link>
          <Link to="/" className="hover:underline">
            FAQs
          </Link>
        </nav>

        {/* Social Media */}
        <div className="flex justify-center gap-6 mb-8">
          <a href="#" aria-label="Facebook" className="hover:opacity-80">
            <Facebook />
          </a>
          <a href="#" aria-label="Instagram" className="hover:opacity-80">
            <Instagram />
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:opacity-80">
            <Linkedin />
          </a>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-white/20 mb-6"></div>

        {/* Copyright */}
        <div className="text-right text-sm opacity-80">
          <p>© {new Date().getFullYear()} Sistema de Monitoria IC - UFBA</p>
        </div>
      </div>
    </footer>
  );
}
