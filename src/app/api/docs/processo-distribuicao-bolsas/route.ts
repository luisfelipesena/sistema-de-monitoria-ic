import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'docs', 'processo-distribuicao-bolsas.md')
    const fileContents = await readFile(filePath, 'utf-8')

    return NextResponse.json(
      { content: fileContents },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error reading markdown file:', error)
    return NextResponse.json({ error: 'Documentação não encontrada' }, { status: 404 })
  }
}
