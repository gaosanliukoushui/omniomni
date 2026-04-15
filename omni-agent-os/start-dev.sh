#!/bin/bash
# Omni-Agent-OS 快速启动脚本 (Linux/macOS)
# 使用方法: chmod +x start-dev.sh && ./start-dev.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "========================================"
echo "   Omni-Agent-OS 快速启动脚本"
echo "========================================"
echo ""

# 1. 检查基础工具
echo "[1/6] 检查环境..."
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo "  [错误] 缺少 $2"
        exit 1
    else
        echo "  [OK] $2"
    fi
}

check_tool java "JDK"
check_tool mvn "Maven"
check_tool node "Node.js"
check_tool python3 "Python"

# 2. 启动基础设施
echo ""
echo "[2/6] 检查基础设施..."

# 检查 Docker
if command -v docker &> /dev/null; then
    # 检查 MySQL
    if ! docker ps --filter "name=mysql-omni" --format "{{.Names}}" 2>/dev/null | grep -q "mysql-omni"; then
        echo "  [启动] MySQL..."
        docker run -d --name mysql-omni -p 3307:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0 > /dev/null 2>&1
        echo "  [OK] MySQL 已启动 (端口 3307)"
    else
        echo "  [OK] MySQL 已运行"
    fi

    # 检查 RabbitMQ
    if ! docker ps --filter "name=rabbitmq-omni" --format "{{.Names}}" 2>/dev/null | grep -q "rabbitmq-omni"; then
        echo "  [启动] RabbitMQ..."
        docker run -d --name rabbitmq-omni -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest rabbitmq:3-management > /dev/null 2>&1
        echo "  [OK] RabbitMQ 已启动 (端口 5672, 15672)"
    else
        echo "  [OK] RabbitMQ 已运行"
    fi
else
    echo "  [警告] Docker 未安装，请手动启动 MySQL 和 RabbitMQ"
fi

# 3. 编译 Java 项目
echo ""
echo "[3/6] 编译 Java 项目..."
cd "$PROJECT_ROOT"
mvn clean install -DskipTests -q
if [ $? -eq 0 ]; then
    echo "  [OK] 项目编译成功"
else
    echo "  [错误] Maven 编译失败"
    exit 1
fi

# 4. 启动 Java 后端服务
echo ""
echo "[4/6] 启动后端服务..."

echo "  [启动] omni-auth (:8081)..."
gnome-terminal --tab --title="omni-auth" -- bash -c "cd '$PROJECT_ROOT/omni-auth'; mvn spring-boot:run" 2>/dev/null || \
xterm -title "omni-auth" -e "cd '$PROJECT_ROOT/omni-auth'; mvn spring-boot:run" 2>/dev/null || \
open -a Terminal --args "cd '$PROJECT_ROOT/omni-auth'; mvn spring-boot:run" 2>/dev/null || \
echo "  请手动运行: cd $PROJECT_ROOT/omni-auth && mvn spring-boot:run"

sleep 3

echo "  [启动] omni-knowledge (:8082)..."
gnome-terminal --tab --title="omni-knowledge" -- bash -c "cd '$PROJECT_ROOT/omni-knowledge'; mvn spring-boot:run" 2>/dev/null || \
xterm -title "omni-knowledge" -e "cd '$PROJECT_ROOT/omni-knowledge'; mvn spring-boot:run" 2>/dev/null || \
open -a Terminal --args "cd '$PROJECT_ROOT/omni-knowledge'; mvn spring-boot:run" 2>/dev/null || \
echo "  请手动运行: cd $PROJECT_ROOT/omni-knowledge && mvn spring-boot:run"

sleep 3

echo "  [启动] omni-gateway (:8080)..."
gnome-terminal --tab --title="omni-gateway" -- bash -c "cd '$PROJECT_ROOT/omni-gateway'; mvn spring-boot:run" 2>/dev/null || \
xterm -title "omni-gateway" -e "cd '$PROJECT_ROOT/omni-gateway'; mvn spring-boot:run" 2>/dev/null || \
open -a Terminal --args "cd '$PROJECT_ROOT/omni-gateway'; mvn spring-boot:run" 2>/dev/null || \
echo "  请手动运行: cd $PROJECT_ROOT/omni-gateway && mvn spring-boot:run"

# 5. 启动前端
echo ""
echo "[5/6] 启动前端..."
echo "  [启动] Frontend (:3000)..."
gnome-terminal --tab --title="Frontend" -- bash -c "cd '$PROJECT_ROOT/frontend'; npm run dev" 2>/dev/null || \
xterm -title "Frontend" -e "cd '$PROJECT_ROOT/frontend'; npm run dev" 2>/dev/null || \
open -a Terminal --args "cd '$PROJECT_ROOT/frontend'; npm run dev" 2>/dev/null || \
echo "  请手动运行: cd $PROJECT_ROOT/frontend && npm run dev"

# 6. 完成
echo ""
echo "========================================"
echo "   启动完成！"
echo "========================================"
echo ""
echo "服务地址:"
echo "  - 前端控制台:  http://localhost:3000"
echo "  - API 网关:    http://localhost:8080"
echo "  - 认证服务:    http://localhost:8081"
echo "  - 知识库服务:  http://localhost:8082"
echo "  - RabbitMQ:    http://localhost:15672"
echo ""
echo "[提示] 首次启动可能需要几分钟下载依赖..."
echo ""
