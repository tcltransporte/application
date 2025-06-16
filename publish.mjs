import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publishDir = path.join(__dirname, 'publish');
const archivePath = path.join(__dirname, 'publish.tar.gz');

async function prepareBuildFolder() {
  console.log('🧹 Limpando publish...');
  await fse.remove(publishDir);
  await fs.mkdir(publishDir);

  console.log('📦 Copiando arquivos...');
  await fse.copy('.next', path.join(publishDir, '.next'));
  await fse.copy('public', path.join(publishDir, 'public'));
  await fse.copy('package.json', path.join(publishDir, 'package.json'));

  console.log('✔️ Pasta publish preparada');
}

async function main() {
  try {
    await prepareBuildFolder();

    console.log('📦 Compactando pasta publish...');
    execSync(`tar -czf ${archivePath} -C ${publishDir} .`, { stdio: 'inherit' });

    console.log('📤 Enviando arquivo compactado via SCP...');
    const remoteUser = process.env.SSH_USER;
    const remoteHost = process.env.SSH_HOST;
    const remotePath = process.env.SSH_REMOTE_PATH || '~/app';

    execSync(`scp ${archivePath} ${remoteUser}@${remoteHost}:${remotePath}/publish.tar.gz`, {
      stdio: 'inherit',
    });

    console.log('📦 Descompactando arquivo no servidor e atualizando app...');
    execSync(
      `ssh ${remoteUser}@${remoteHost} "tar -xzf ${remotePath}/publish.tar.gz -C ${remotePath} && rm ${remotePath}/publish.tar.gz"`,
      { stdio: 'inherit' }
    );

    console.log('🔄 Reiniciando PM2...');
    execSync(`ssh ${remoteUser}@${remoteHost} "pm2 restart corepay"`, {
      stdio: 'inherit',
    });

    console.log('✅ Deploy finalizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no deploy:', err.message);
  }
}

main();
