import fs from 'fs'

const icLogoPath = '/Users/luisfelipesena/Development/Personal/sistema-de-monitoria-ic/public/images/ic-logo.png'
const imagesTsPath = '/Users/luisfelipesena/Development/Personal/sistema-de-monitoria-ic/src/utils/images.ts'

try {
  const icLogoBuffer = fs.readFileSync(icLogoPath)
  const icLogoBase64 = `data:image/png;base64,${icLogoBuffer.toString('base64')}`

  let imagesTsContent = fs.readFileSync(imagesTsPath, 'utf8')

  if (!imagesTsContent.includes('export const IC_LOGO_BASE64')) {
    imagesTsContent += `\nexport const IC_LOGO_BASE64 = '${icLogoBase64}';\n`
    fs.writeFileSync(imagesTsPath, imagesTsContent)
    console.log('Successfully added IC_LOGO_BASE64 to images.ts')
  } else {
    console.log('IC_LOGO_BASE64 already exists in images.ts')
  }
} catch (error) {
  console.error('Error updating images.ts:', error)
}
