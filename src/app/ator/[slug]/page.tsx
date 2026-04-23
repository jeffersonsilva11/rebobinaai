// src/app/ator/[slug]/page.tsx — Página do ator/atriz

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'

export const revalidate = 86400

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return []
  try {
    // Pré-renderiza pessoas que tem títulos publicados
    const people = await prisma.person.findMany({
      where: { titleRoles: { some: { title: { status: 'PUBLISHED' } } } },
      orderBy: { name: 'asc' },
      take: 500,
      select: { slug: true },
    })
    return people.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

async function getPerson(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: {
      titleRoles: {
        where: { title: { status: 'PUBLISHED' } },
        include: {
          title: {
            select: {
              id: true,
              slug: true,
              titlePt: true,
              type: true,
              year: true,
              posterUrl: true,
              ratings: { select: { imdbScore: true } },
            },
          },
        },
        orderBy: { title: { year: 'desc' } },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const person = await getPerson(params.slug).catch(() => null)
  if (!person) return { title: 'Pessoa não encontrada' }
  return {
    title: `${person.name} — Filmes e séries | Rebobina.ai`,
    description: person.bioPt ?? `Filmografia de ${person.name} no Rebobina.ai`,
    openGraph: {
      images: person.photoUrl ? [person.photoUrl] : [],
    },
  }
}

function formatDate(d: Date | null | undefined) {
  if (!d) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export default async function AtorPage({ params }: { params: { slug: string } }) {
  const person = await getPerson(params.slug).catch(() => null)
  if (!person) notFound()

  // Agrupa por tipo de role
  const actorRoles = person.titleRoles.filter((r) => r.role === 'ACTOR')
  const directorRoles = person.titleRoles.filter((r) => r.role === 'DIRECTOR')

  const born = formatDate(person.birthDate)
  const died = formatDate(person.deathDate)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl bg-white/5 md:w-full">
          {person.photoUrl ? (
            <Image
              src={person.photoUrl}
              alt={person.name}
              fill
              sizes="(max-width: 768px) 160px, 240px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-white/30">
              {person.name[0]}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{person.name}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
            {born && <span>Nascimento: {born}</span>}
            {died && <span>Falecimento: {died}</span>}
            {person.nationality && <span>Nacionalidade: {person.nationality}</span>}
          </div>

          {person.bioPt && (
            <p className="mt-4 leading-relaxed text-white/80">{person.bioPt}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {person.imdbId && (
              <a
                href={`https://www.imdb.com/name/${person.imdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
              >
                IMDb
              </a>
            )}
            {person.instagramId && (
              <a
                href={`https://instagram.com/${person.instagramId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Direção */}
      {directorRoles.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Direção ({directorRoles.length})</h2>
          <FilmGrid roles={directorRoles} />
        </section>
      )}

      {/* Atuação */}
      {actorRoles.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Atuação ({actorRoles.length})</h2>
          <FilmGrid roles={actorRoles} />
        </section>
      )}

      {person.titleRoles.length === 0 && (
        <p className="mt-10 text-white/50">Nenhum título catalogado no momento.</p>
      )}
    </div>
  )
}

function FilmGrid({ roles }: { roles: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {roles.map((r) => (
        <Link
          key={r.title.id}
          href={`/${r.title.type === 'SERIES' ? 'serie' : 'filme'}/${r.title.slug}`}
          className="group"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
            {r.title.posterUrl && (
              <Image
                src={r.title.posterUrl}
                alt={r.title.titlePt}
                fill
                sizes="(max-width: 640px) 50vw, 16vw"
                className="object-cover transition group-hover:scale-105"
              />
            )}
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-medium">{r.title.titlePt}</h3>
          <p className="text-xs text-white/50">
            {r.title.year}
            {r.characterName ? ` · ${r.characterName}` : ''}
          </p>
        </Link>
      ))}
    </div>
  )
}
