import Image from 'next/image'
import Link from 'next/link'

interface CastMember {
  role: string
  characterName: string | null
  person: {
    name: string
    slug: string
    photoUrl: string | null
  }
}

export function TitleCast({ cast }: { cast: CastMember[] }) {
  const actors = cast.filter((c) => c.role === 'ACTOR').slice(0, 8)
  const directors = cast.filter((c) => c.role === 'DIRECTOR')

  if (!actors.length && !directors.length) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="mb-4 text-2xl font-bold">Elenco & Direção</h2>

      {directors.length > 0 && (
        <p className="mb-6 text-sm text-white/70">
          <span className="text-white/50">Direção: </span>
          {directors.map((d) => d.person.name).join(', ')}
        </p>
      )}

      {actors.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {actors.map((c) => (
            <Link
              key={c.person.slug}
              href={`/ator/${c.person.slug}`}
              className="group text-center"
            >
              <div className="relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-white/5">
                {c.person.photoUrl ? (
                  <Image
                    src={c.person.photoUrl}
                    alt={c.person.name}
                    fill
                    sizes="80px"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/30">
                    ?
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium">{c.person.name}</p>
              {c.characterName && (
                <p className="line-clamp-1 text-xs text-white/40">{c.characterName}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
