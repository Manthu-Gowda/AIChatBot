
import { prisma } from '../prisma/client'
import { decrypt } from '../services/cryptoService'

async function main() {
  const projectId = process.argv[2]
  if (!projectId) {
    console.error('Please provide a project ID')
    process.exit(1)
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    console.error('Project not found')
    process.exit(1)
  }

  console.log('Project:', project.name)
  console.log('Provider:', (project as any).provider)
  
  const keyEnc = (project as any).apiKeyEnc
  if (!keyEnc) {
    console.log('No apiKeyEnc found on project')
    return
  }

  try {
    const key = decrypt(keyEnc)
    console.log('Decrypted Key Length:', key.length)
    console.log('Starts with:', key.slice(0, 5))
    console.log('Ends with:', key.slice(-5))
    console.log('Has whitespace?', /\s/.test(key))
    if (/\s/.test(key)) {
        console.log('Whitespace details:', JSON.stringify(key))
    }
    console.log('Hex debug:', Buffer.from(key).toString('hex'))
  } catch (e) {
    console.error('Decryption failed:', e)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
