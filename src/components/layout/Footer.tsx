export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-white/60">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-white">Rebobina.ai</p>
            <p className="mt-1 text-xs">
              Descubra filmes e séries por linguagem natural.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs">
            <a href="/sobre" className="hover:text-white">Sobre</a>
            <a href="/contato" className="hover:text-white">Contato</a>
            <a href="/privacidade" className="hover:text-white">Privacidade</a>
            <a href="/termos" className="hover:text-white">Termos</a>
          </nav>
        </div>
        <p className="mt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Rebobina.ai. Dados de TMDB, OMDb e YouTube.
        </p>
      </div>
    </footer>
  )
}
