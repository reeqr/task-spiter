#!/bin/bash

echo "🔑 测试智谱 AI API Key"
echo "==========================================="

API_KEY="72e835cc84314fb189255cc6c7fcd26e.WSaTxU0282PnQqCM"

echo "API Key: ${API_KEY:0:10}..."
echo "==========================================="

curl -X POST 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"model":"glm-4-flash","messages":[{"role":"user","content":"你好"}],"max_tokens":100}' \
  2>&1

echo ""
echo "==========================================="
