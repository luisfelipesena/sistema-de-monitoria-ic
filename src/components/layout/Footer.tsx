export function Footer() {
  return (
    <footer className="w-full bg-primary text-white py-10 px-6">
      <div className="container mx-auto">
        {/* Logo and Name */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          <img
            src="/images/ic-logo-clean.png"
            alt="Sistema de Monitorias"
            className="h-14 w-14"
          />
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold">SISTEMA DE MONITORIAS</h3>
            <p className="text-sm">INSTITUTO DE COMPUTAÇÃO UFBA</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
