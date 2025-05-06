import { Facebook, Instagram, Linkedin } from 'lucide-react';


export function Footer() {
  return (
    <footer className="bg-[#1B4377] text-white px-4 py-8 flex flex-col items-center gap-4 text-sm">
      {/* Logo + título */}
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/logo.png" alt="Logo" className="h-10" />
        <p className="text-xs font-semibold">
          SISTEMA DE MONITORIAS <br />
          INSTITUTO DE COMPUTAÇÃO UFBA
        </p>
      </div>

      {/* Menu */}
      <nav className="flex flex-wrap justify-center gap-6 mt-2 text-white text-sm font-light">
        <a href="#" className="hover:underline">Home</a>
        <a href="#" className="hover:underline">About</a>
        <a href="#" className="hover:underline">Services</a>
        <a href="#" className="hover:underline">Get in touch</a>
        <a href="#" className="hover:underline">FAQs</a>
      </nav>

      {/* Social icons */}
      <div className="flex gap-4 mt-2">
        <a href="#"><Facebook className="w-4 h-4" /></a>
        <a href="#"><Instagram className="w-4 h-4" /></a>
        <a href="#"><Linkedin className="w-4 h-4" /></a>
      </div>

      {/* Linha */}
      <hr className="w-full border-t border-gray-200 my-4" />

      {/* Copyright */}
      <p className="text-xs text-gray-300">
        Non Copyrighted © 2022 Upload by rich technologies
      </p>
    </footer>
  );
}
