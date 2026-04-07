// 测试环境变量加载
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
config({ path: resolve(__dirname, '.env') });

console.log('🔑 测试环境变量加载');
console.log('='.repeat(50));
console.log('VITE_ZHIPU_API_KEY:', process.env.VITE_ZHIPU_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('Key 长度:', process.env.VITE_ZHIPU_API_KEY?.length || 0);
console.log('Key 前缀:', process.env.VITE_ZHIPU_API_KEY?.substring(0, 10) + '...');
console.log('='.repeat(50));
