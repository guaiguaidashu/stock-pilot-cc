#!/bin/bash
# StockPilot 启动脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🚀 启动 StockPilot..."

# 检查端口
for PORT in 3456 8000; do
  if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用"
    lsof -i :$PORT | grep LISTEN | awk '{print "  ", $1, $9}'
  fi
done

# 启动后端
echo "📦 启动后端 (FastAPI)..."
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
fi
source venv/bin/activate
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/stockpilot-backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 启动前端
echo "📦 启动前端 (Next.js)..."
cd "$FRONTEND_DIR"
nohup npm run dev -- --port 3456 > /tmp/stockpilot-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

# 等待启动
sleep 3

# 检查
echo ""
echo "✅ StockPilot 已启动"
echo "   前端: http://localhost:3456"
echo "   后端: http://localhost:8000"
echo "   API:  http://localhost:8000/docs"
echo ""
echo "📝 日志位置:"
echo "   后端: /tmp/stockpilot-backend.log"
echo "   前端: /tmp/stockpilot-frontend.log"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"