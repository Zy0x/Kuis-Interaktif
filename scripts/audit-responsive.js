import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devicesPath = path.resolve(__dirname, '../docs/devices-emulation.json');
const rawDevices = JSON.parse(fs.readFileSync(devicesPath, 'utf8').replace(/^\uFEFF/, ''));

console.log('='.repeat(72));
console.log('  MATRIKS AUDIT VIEWPORT RESPONSIVITAS - KUIS SERU');
console.log('='.repeat(72));

console.log('\n📱 DAFTAR PERANGKAT EMULASI KUSTOM (CHROME DEVTOOLS / PLAYWRIGHT):');
console.table(
  rawDevices.map((d, index) => ({
    No: index + 1,
    Nama: d.title,
    'Lebar (px)': d.screen.vertical.width,
    'Tinggi (px)': d.screen.vertical.height,
    DPR: d.screen['device-pixel-ratio'],
    Touch: d.capabilities.includes('touch') ? 'Ya' : 'Tidak',
    Mobile: d.capabilities.includes('mobile') ? 'Ya' : 'Tidak'
  }))
);

console.log('\n✅ Seluruh profil perangkat terdaftar di docs/devices-emulation.json');
console.log('ℹ️  Format dapat langsung diimpor ke Chrome DevTools via:');
console.log('   InspectorFrontendHost.setPreference("custom-emulated-device-list", ...)\n');
