import { db } from "@/server/db"
import { userTable } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import sharp from "sharp"

const SVG_SIGNATURE = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
  <path d="M 20 60 Q 45 15 75 55 T 120 45 T 165 70 T 215 35 T 260 60 T 285 45" stroke="#102a43" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 35 75 C 85 90 145 80 235 72" stroke="#102a43" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="180" y="90" font-family="Times New Roman, serif" font-size="12" font-style="italic" fill="#102a43">Prof. Carlos Silva</text>
</svg>
`

async function main() {
  console.log("Generating PNG base64 signature with sharp...")
  const buffer = await sharp(Buffer.from(SVG_SIGNATURE)).png().toBuffer()
  const pngBase64 = `data:image/png;base64,${buffer.toString("base64")}`

  console.log("Updating Carlos Silva in userTable...")
  await db
    .update(userTable)
    .set({ assinaturaDefault: pngBase64 })
    .where(eq(userTable.email, "carlos.silva@ufba.br"))

  console.log("Successfully set digital signature for carlos.silva@ufba.br!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
