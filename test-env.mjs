// 测试环境变量加载
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = resolve(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');

  console.log('🔑 测试 .env 文件读取');
  console.log('='.repeat(50));
  console.log('文件路径:', envPath);
  console.log('文件内容:');
  console.log(envContent);
  console.log('='.repeat(50));

  const apiKey = envContent.split('=')[1]?.trim();
  console.log('API Key:', apiKey ? '✅ 已找到' : '❌ 未找到');
  console.log('Key 长度:', apiKey?.length || 0);
  console.log('Key 前缀:', apiKey?.substring(0, 10) + '...');
  console.log('='.repeat(50));
} catch (error) {
  console.error('❌ 读取 .env 文件失败:', error.message);
}
