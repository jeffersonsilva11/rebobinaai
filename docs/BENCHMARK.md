# BENCHMARK — Streamings & Agregadores 2026

> Pesquisa competitiva usada para orientar decisões de produto, design e monetização do Rebobina.ai.
> Atualizar a cada 6 meses ou quando surgir competidor relevante.

---

## 1. Plataformas de streaming (Brasil)

### Netflix
- **UX:** grid de pôsteres com hover-preview em autoplay; carrosséis horizontais temáticos; "Top 10 no Brasil" em destaque; pesquisa por palavras-chave simples, sem IA conversacional.
- **Design 2026:** escuro total, vermelho como único acento, tipografia Netflix Sans proprietária, motion extremamente polido (parallax nos banners, fade-in progressivo nos cards).
- **Busca:** keyword match + algum vetor semântico rudimentar. Não interpreta linguagem natural livre em PT-BR. Zero explicação de relevância.
- **Recomendação:** collaborative filtering proprietário; sem transparência ("Porque você assistiu X" é tudo que mostra).
- **Monetização:** SVOD (Basic/Standard/Premium) + plano com anúncios (Standard com Anúncios ~R$18/mês BR 2025). Affiliate programa descontinuado em 2014 — sem parceria de deeplink.
- **SEO:** domínio fortíssimo; mas páginas de título são fracas em FAQ/schema estruturado. Nenhuma estratégia GEO visível.
- **Fraqueza principal:** jardim murado — não indica onde assistir fora da própria base; pesquisa dumb; zero voz editorial PT-BR.

### Amazon Prime Video
- **UX:** misto de conteúdo próprio + aluguel/compra + canais (add-ons). Interface fragmentada — usuário não sabe o que está incluso.
- **Design:** azul/branco corporativo; menos polimento que Netflix em mobile.
- **Busca:** melhor que Netflix em nomes de atores; ainda keyword-based.
- **Monetização:** bundled com Prime (~R$21/mês BR); Amazon Associados BR mais fácil parceria de deeplink disponível para terceiros (até 8% comissão em Prime Video).
- **Fraqueza principal:** UX confusa entre "incluso" e "compra/aluguel"; bundle força lock-in que aliena usuários casuais.

### Apple TV+
- **UX:** catálogo minúsculo mas curado; interface "Liquid Glass" (tvOS 26) — translucidez, blur, reflexos de luz; carrossel com arte de fundo dinâmica; zero anúncios no app.
- **Design 2026:** referência absoluta — San Francisco tipografia, espaço generoso, microinterações táteis, transições de compartilhamento de elementos (matched geometry). Motion design > qualquer concorrente.
- **Busca:** Siri integration básica; sem busca semântica no app.
- **Monetização:** SVOD puro (~R$21/mês BR); sem affiliate para terceiros.
- **Fraqueza principal:** catálogo pequeno; não é meta-streaming; sem voz editorial para conteúdo de terceiros.

### Max (HBO)
- **UX:** hierarquia forte de "Max Originals" acima de tudo; tiles maiores que Netflix; editorias temáticas ("Melhor do cinema", "Séries premiadas").
- **Design:** preto + gradiente roxo/azul; tipografia serif em títulos evoca prestígio editorial.
- **Busca:** keyword match; sem semântica.
- **Monetização:** SVOD (~R$29-69/mês BR por tier); sem affiliate.
- **Fraqueza:** caro para usuário casual; catálogo BR menor que US.

### Disney+
- **UX:** navegação por marcas (Disney/Pixar/Marvel/Star Wars/National Geographic); funciona bem para fãs; péssimo para descoberta fora do ecossistema.
- **Design:** azul estrelas, tipografia rounded; conteúdo infantil domina acima do dobramento.
- **Fraqueza:** descoberta fora das franquias é quase impossível; zero editorial voice para conteúdo adulto.

### Globoplay
- **UX:** forte em conteúdo ao vivo (Globo linear) + VOD; catálogo de novelas é imbatível no BR.
- **Design:** mais básico; menor investimento em polimento vs. internacionais.
- **Busca:** keyword match, em PT-BR mas sem semântica.
- **Força:** único com âncora de conteúdo ao vivo + exclusivo regional (novelas, BBB, Esportes).
- **Fraqueza:** UX datada vs. internacionais; descoberta de filme fraca.

### Paramount+
- **Busca/descoberta:** muito fraca; catálogo menor; menos relevante para benchmark de UX.

---

## 2. Agregadores & descoberta

### JustWatch (referência global mais próxima)
- **Proposta:** onde assistir cada título no Brasil; filtros por streaming, gênero, nota.
- **UX:** funcional mas genérico; design flat sem personalidade; grid padrão, zero editorial.
- **Busca:** keyword simples; sem linguagem natural; sem % de match; sem explicação de relevância.
- **Força:** cobertura de plataformas (18+ no BR); popularidade como sinal de ranking; notificações de chegada.
- **Monetização:** affiliate deeplinks para as plataformas; B2B data licensing (dados de audiência vendidos para studios/streamings); Sponsored Recommendations (posição paga no ranking).
- **Fraqueza (Rebobina pode atacar):**
  1. Busca dumb — não entende "algo leve pra assistir com família no sábado".
  2. Zero voz editorial em PT-BR — copypaste de sinopses em inglês.
  3. Design sem identidade — parece planilha.
  4. Nenhuma personalização.
  5. SEO fraco em FAQ/schema estruturado.
  6. Zero estratégia GEO (ChatGPT/Perplexity não citam JustWatch).

### Rotten Tomatoes
- **Força:** autoridade de crítica; Tomatômetro é marca reconhecida; SEO dominante em "X% Rotten Tomatoes [titulo]".
- **Fraqueza:** norte-americano; sem onde assistir integrado; zero PT-BR.

### Letterboxd
- **Força:** comunidade de cinéfilos; listas sociais; visual polido (dark, poster-centric); descoberta via "listas de amigos".
- **Fraqueza:** sem onde assistir; foco em cinema, ignora séries.

### AdoroCinema
- **Força:** único agregador com editorial forte em PT-BR; críticas originais em português; SEO bom para "melhores filmes BR".
- **Fraqueza:** design datado; sem busca semântica; zero onde assistir integrado; sem streaming links.

### TVTime / Trakt
- **Força:** tracking de episódios; calendário de lançamentos; comunidade de séries.
- **Fraqueza:** focado em séries; sem busca por mood; sem PT-BR editorial.

---

## 3. UX 2026 — tendências identificadas

### Design
- **Liquid Glass (Apple tvOS 26):** translucidez, blur de fundo dinâmico, reflexos de luz em elementos de UI. Melhor referência visual do ano.
- **Motion como produto:** transições de elemento compartilhado (poster → hero); parallax em background; microinterações táteis (ripple, bounce).
- **Tipografia cinematográfica:** serifa em títulos longos (prestígio), sans-serif em UI (leitura). Contraste alto.
- **Espaço generoso:** grids de pôsteres com mais respiro; não 6+ colunas em desktop.
- **Dark-first:** todas as referências top são dark. Fundo quase preto (#0a0a0a), não preto puro.

### Busca & descoberta
- **Command palette:** atalho Cmd+K / toque no search abre overlay com busca em tempo real (Perplexity-style).
- **Chips de refinamento:** após resultado, chips contextuais ("mais curto", "com legenda", "na Netflix") — sem reformular query.
- **Resultado com explicação:** nenhum concorrente mostra *por que* o título aparece. Rebobina pode ser o primeiro.
- **Skeleton loading:** cards aparecem progressivamente, não spinner global.

### Recomendação
- **IA explicável:** "Por que este título?" ainda é zero em todos os concorrentes. Oportunidade direta.
- **Mood-based:** "algo pra relaxar", "pra chorar", "ação sem pensar" — nicho não atendido por nenhuma plataforma proprietária.

---

## 4. Monetização — modelos identificados

| Modelo | Quem usa | Viabilidade Rebobina |
|--------|----------|----------------------|
| Affiliate deeplinks | JustWatch, AdoroCinema | **Alta.** Amazon Associados BR (fácil de aprovar). Outros via redes (Awin, Impact). |
| B2B data licensing | JustWatch | Médio prazo — precisa de volume de usuários. |
| Sponsored Recommendations | JustWatch | Médio prazo — anúncio nativo de "título em destaque". |
| SVOD próprio | Todos os streamings | Fora do escopo — Rebobina não distribui conteúdo. |
| Newsletter patrocinada | Letterboxd (informal) | Baixo esforço — curadoria semanal com sponsor. |
| Anúncio display | AdoroCinema, RT | Evitar — degrada UX; só em último caso. |

**Netflix NÃO tem affiliate** (descontinuado em 2014). Focar em: Amazon, Apple TV+, Paramount+, Max, Disney+ (alguns via redes de afiliados).

---

## 5. SEO & GEO — oportunidades

### SEO tradicional
- **Queries-alvo BR:** "onde assistir [título]", "melhores filmes [gênero] [ano]", "[título] Netflix Brasil", "filmes [mood] pra assistir".
- **Schema.org:** `WatchAction` + `eligibleRegion: BR` + `VideoObject` — Google SGE cita páginas com schema correto.
- **FAQPage schema** em páginas de título — "Onde assistir X no Brasil?", "X está na Netflix?".
- **Sitemap dinâmico** com todos os slugs — indispensável para indexar >1000 títulos.
- **Core Web Vitals:** LCP < 2.5s (ISR + CDN resolvem); CLS < 0.1 (reservar espaço de imagem); INP < 200ms.

### GEO (Generative Engine Optimization)
- **`/llms.txt`** na raiz — instrui ChatGPT/Claude/Perplexity sobre o que o site faz; aumenta chance de citação.
- **Densidade factual:** páginas com "Interstellar está disponível no Max e Apple TV+ no Brasil (2026)" são citadas em perguntas de IA. JustWatch não tem esse texto otimizado.
- **Linguagem natural nas sinopses:** sinopses em PT-BR que respondem perguntas ("É um filme de ficção científica...") — as IAs copiam esses textos.
- **FAQ markup em cada título** — resposta direta a "onde assistir" vai aparecer no ChatGPT quando o usuário perguntar.

---

## 6. Gaps principais — onde Rebobina pode ganhar

| Gap | Impacto | Ninguém resolve ainda |
|-----|---------|----------------------|
| Busca em linguagem natural PT-BR | Alto | JustWatch, Netflix, todos |
| Explicação transparente de relevância (% match + razões) | Alto | Todos |
| Sinopses editoriais originais em PT-BR | Médio | JustWatch (copypaste), Netflix (tradução) |
| Aggregador neutro entre plataformas | Alto | Cada plataforma é parcial pro próprio catálogo |
| GEO: FAQ schema + llms.txt + densidade factual | Médio | JustWatch tem SEO básico, GEO zero |
| Design cinematográfico em agregador | Médio | JustWatch/RT são genéricos; Letterboxd próximo |
| Filtro por ansiedade/estado emocional | Alto | Nenhum |
| Recomendação explicável ("por que esse título") | Alto | Nenhum |
