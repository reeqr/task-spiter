#!/bin/bash
# 部署脚本 - 将项目构建并部署到服务器

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署任务...${NC}"

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装，请先安装 pnpm${NC}"
    exit 1
fi

# 检查 rsync 是否安装
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ rsync 未安装，请先安装 rsync${NC}"
    exit 1
fi

# 检查 SSH 目标服务器配置
SSH_TARGET=$(grep -oP '(?<=ssh\s+).*(?=@)' ~/.ssh/config 2>/dev/null | head -1 || echo "ubuntu@www.reeqr.com")

# 检查并归档未归档的 OpenSpec changes
CHANGES_DIR="openspec/changes"
if [ -d "$CHANGES_DIR" ]; then
    # 找出未归档的变更目录（排除 archive 目录）
    UNARCHIVED=$(find "$CHANGES_DIR" -maxdepth 1 -type d ! -name 'archive' ! -name 'changes' -printf '%f\n' 2>/dev/null || true)
    if [ -n "$UNARCHIVED" ]; then
        echo -e "${YELLOW}📁 发现未归档的 OpenSpec changes，正在归档...${NC}"
        for CHANGE in $UNARCHIVED; do
            if [ -f "$CHANGES_DIR/$CHANGE/.openspec.yaml" ]; then
                echo -e "  ${GREEN}归档: $CHANGE${NC}"
                mkdir -p "$CHANGES_DIR/archive"
                mv "$CHANGES_DIR/$CHANGE" "$CHANGES_DIR/archive/"
            fi
        done
        echo -e "${GREEN}✅ 归档完成${NC}"
    fi
fi

echo -e "${YELLOW}📦 Step 1: 安装依赖${NC}"
pnpm install

echo -e "${YELLOW}🔨 Step 2: 构建项目${NC}"
pnpm build

echo -e "${YELLOW}🚀 Step 3: 同步到服务器${NC}"
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.env' \
    dist/ \
    $SSH_TARGET:/var/www/task_spiter/

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}🌐 访问地址: http://www.reeqr.com${NC}"
