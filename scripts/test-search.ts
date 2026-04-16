// scripts/test-search.ts
// Testa busca semântica com uma query

const query = process.argv.slice(2).join(' ') || 'série curta sem ansiedade'

async function main() {
  console.log(`→ Testando busca: "${query}"\n`)

  const res = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    console.error('Erro:', await res.text())
    process.exit(1)
  }

  const data = await res.json()
  console.log('INTENT:', JSON.stringify(data.intent, null, 2))
  console.log('\nRESULTADOS:')
  for (const t of data.results) {
    console.log(`- [${t.matchScore}%] ${t.title_pt} (${t.year}) — ${t.aiReason}`)
  }
}

main().then(() => process.exit(0))
