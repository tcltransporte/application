import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fse from 'fs-extra'
import fs from 'fs/promises'
import dotenv from 'dotenv'
import { rimraf } from 'rimraf'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publishDir = path.join(__dirname, 'publish')
const archivePath = path.join(__dirname, 'publish.tar.gz')

dotenv.config({ path: path.resolve(__dirname, '.env.core') })

async function prepareBuildFolder() {

  console.log('🧹 Cleaning cache folder...')

  rimraf.sync('build')
  rimraf.sync('.next/cache')

  await fse.remove(publishDir)
  await fs.mkdir(publishDir)

  console.log('🧹 Cleaning publish folder...')

  await fse.remove(publishDir)
  await fs.mkdir(publishDir)

  console.log('📦 Copying files...')

  await fse.copy('.next', path.join(publishDir, '.next'))
  await fse.copy('public', path.join(publishDir, 'public'))
  await fse.copy('package.json', path.join(publishDir, 'package.json'))
  await fse.copy('.env.core', path.join(publishDir, '.env'))

  console.log('✔️  Publish folder is ready')

}

async function publish() {
  try {

    await prepareBuildFolder()

    console.log('📦 Compressing publish folder...')

    execSync(`tar -czf ${archivePath} -C ${publishDir} .`, { stdio: 'inherit' })

    console.log('📤 Uploading archive via SCP...')

    const remoteUser = process.env.SSH_USER
    const remoteHost = process.env.SSH_HOST
    const remotePath = process.env.SSH_REMOTE_PATH || '~/app'

    execSync(`scp ${archivePath} ${remoteUser}@${remoteHost}:${remotePath}/publish.tar.gz`, {
      stdio: 'inherit',
    })

    console.log('📦 Extracting archive on server and updating app...')

    execSync(
      `ssh ${remoteUser}@${remoteHost} "tar -xzf ${remotePath}/publish.tar.gz -C ${remotePath} && rm ${remotePath}/publish.tar.gz"`,
      { stdio: 'inherit' }
    )

    console.log('🔄 Restarting PM2...')

    execSync(`ssh ${remoteUser}@${remoteHost} "pm2 restart corepay"`, {
      stdio: 'ignore',
    })

    console.log('✅ Deployment completed successfully!')

  } catch (err) {
    console.error('❌ Deployment failed:', err.message)
  }
}

publish()