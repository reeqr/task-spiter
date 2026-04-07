// 测试 Vite 环境变量加载
import { loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔑 测试 Vite 环境变量加载');
console.log('='.repeat(50));

try {
  // 模拟 Vite 的环境变量加载
  const mode = 'development';
  const envDir = __dirname;

  // 使用 Vite 的 loadEnv
  const env = loadEnv(mode, envDir, '');

  console.log('环境目录:', envDir);
  console.log('模式:', mode);
  console.log('='.repeat(50));

  // 检查环境变量
  if ('VITE_ZHIPU_API_KEY' in env) {
    console.log('✅ VITE_ZHIPU_API_KEY 已加载');
    console.log('Key 长度:', env.VITE_ZHIPU_API_KEY?.length || 0);
    console.log('Key 前缀:', env.VITE_ZHIPU_API_KEY?.substring(0, 10) + '...');
    console.log('完整 Key:', env.VITE_ZHIPU_API_KEY || '未设置');
  } else {
    console.log('❌ VITE_ZHIPU_API_KEY 未加载');
  }

  console.log('='.repeat(50));
} catch (error) {
  console.error('❌ 加载失败:', error.message);
  console.error(error.stack);
}
