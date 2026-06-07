#!/bin/bash

# 进入项目目录
cd "$(dirname "$0")"

echo "=== 知识树本地开发环境启动脚本 ==="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 检查端口是否被占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port ($service) 已被占用"
        return 1
    fi
    return 0
}

echo "📦 检查端口占用..."
check_port 5432 "PostgreSQL" || echo "   PostgreSQL 可能无法启动"
check_port 8000 "Backend API" || echo "   Backend API 可能无法启动"
check_port 5173 "Frontend" || echo "   Frontend 可能无法启动"
echo ""

# 启动服务
echo "🚀 启动服务..."
docker compose -f docker-compose.local.yml up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态："
docker compose -f docker-compose.local.yml ps

echo ""
echo "🌐 访问地址："
echo "   - 前端: http://localhost:5173"
echo "   - 后端: http://localhost:8000"
echo "   - API文档: http://localhost:8000/docs"
echo ""
echo "🛑 停止服务: docker compose -f docker-compose.local.yml down"
echo "🗑️  删除数据: docker compose -f docker-compose.local.yml down -v"