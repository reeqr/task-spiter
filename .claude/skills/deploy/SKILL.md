# Deploy Skill - 项目部署脚本

## 描述

这是一个用于快速部署 AI 学习助手项目到生产服务器的脚本。

## 功能

- 自动安装依赖 (pnpm install)
- 构建生产版本 (pnpm build)
- 同步文件到服务器 (rsync)
- 显示部署结果

## 使用方法

### 在终端中直接运行

```bash
# 直接执行部署脚本
./.claude/skills/deploy/deploy.sh

# 或者使用完整路径
bash .claude/skills/deploy/deploy.sh
```

### 在 Claude Code 中调用

当用户说"帮我部署"时，执行以下命令：

```bash
cd /Users/td/VscodeProjects/ai_project/task_spiter && pnpm build && rsync -avz --delete dist/ ubuntu@www.reeqr.com:/var/www/task_spiter/
```

## 前置要求

1. **pnpm** - Node.js 包管理器
   ```bash
   npm install -g pnpm
   ```

2. **rsync** - 文件同步工具（macOS 自带）

3. **SSH 配置** - 确保可以无密码连接服务器
   ```bash
   # 测试连接
   ssh ubuntu@www.reeqr.com "echo 'SSH 连接成功'"
   ```

## 服务器配置

- **服务器地址**: www.reeqr.com
- **部署路径**: /var/www/task_spiter/
- **访问地址**: http://www.reeqr.com

## 自定义修改

如需修改服务器地址，编辑 `deploy.sh` 脚本中的 `SSH_TARGET` 变量。

## 部署检查清单

- [x] 依赖已安装
- [x] 构建成功
- [x] 文件已同步
- [ ] 服务器验证（可选）

## 故障排除

### 构建失败
```bash
# 清除缓存后重试
rm -rf node_modules/.vite
pnpm build
```

### SSH 连接失败
```bash
# 检查 SSH 配置
cat ~/.ssh/config

# 测试连接
ssh -v ubuntu@www.reeqr.com
```

### rsync 同步失败
```bash
# 检查目标目录权限
ssh ubuntu@www.reeqr.com "ls -la /var/www/"
```
