#!/bin/bash
# Motel API Service 部署脚本
# 支持平滑升级，数据自动备份

set -e

APP_DIR="/home/ubuntu"
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 创建备份目录
mkdir -p "$BACKUP_DIR"

log_info "========================================"
log_info "Motel API Service 部署脚本"
log_info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "========================================"

# 检查是否以正确用户运行
if [ "$(id -u)" = "0" ]; then
    log_warn "建议以非 root 用户运行，但继续..."
fi

# 1. 备份当前数据
log_info "1/6 备份当前数据..."
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

tar -czf "$BACKUP_FILE" \
    -C "$APP_DIR" \
    --exclude='logs/*.log' \
    --exclude='logs/*.log.json' \
    --exclude='node_modules' \
    --exclude='web/node_modules' \
    --exclude='web/admin-spa/node_modules' \
    --exclude='web/admin-spa/dist' \
    --exclude='.git' \
    config/config.js .env data \
    2>/dev/null || true

log_info "备份已保存: $BACKUP_FILE"

# 清理旧备份（保留最近10个）
ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

# 2. 停止服务
log_info "2/6 停止服务..."
cd "$APP_DIR"
if [ -f "$APP_DIR/motel-api-service.pid" ]; then
    npm run service:stop 2>/dev/null || {
        PID=$(cat "$APP_DIR/motel-api-service.pid" 2>/dev/null)
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null || true
        fi
        rm -f "$APP_DIR/motel-api-service.pid"
    }
    log_info "服务已停止"
else
    log_warn "服务未运行"
fi

# 等待进程完全退出
sleep 2

# 3. 更新代码
log_info "3/6 更新代码..."
cd "$APP_DIR"

if [ -d ".git" ]; then
    # Git 方式更新
    git fetch origin main
    git pull origin main --no-edit || {
        log_warn "Git pull 失败，尝试使用 tarball 方式..."
        USE_TARBALL=1
    }
else
    USE_TARBALL=1
fi

if [ "$USE_TARBALL" = "1" ]; then
    # Tarball 方式更新
    log_info "使用 tarball 方式更新..."
    TARBALL="/tmp/motel-api-service.tar.gz"

    if curl -sfL --connect-timeout 30 -o "$TARBALL" "https://codeload.github.com/AiYou-Author/motel-api-service/tar.gz/refs/heads/main"; then
        cd /tmp
        rm -rf motel-update
        mkdir -p motel-update
        tar -xzf motel.tar.gz -C motel-update 2>/dev/null || tar -xzf motel-api-service.tar.gz -C motel-update

        SOURCE_DIR=$(find /tmp/motel-update -maxdepth 1 -type d -name "*-*" | head -1)

        if [ -n "$SOURCE_DIR" ] && [ -d "$SOURCE_DIR" ]; then
            # 备份关键文件
            cp "$APP_DIR/config/config.js" /tmp/config.js.bak
            cp "$APP_DIR/.env" /tmp/.env.bak
            cp -r "$APP_DIR/data" /tmp/data.bak

            # 删除旧代码文件（保留数据目录）
            rm -rf "$APP_DIR/src" "$APP_DIR/web" "$APP_DIR/scripts" "$APP_DIR/config" "$APP_DIR/.github" "$APP_DIR/.gitignore" "$APP_DIR/.gitattributes" "$APP_DIR/CLAUDE.md" "$APP_DIR/docs" "$APP_DIR/tests" "$APP_DIR/resources"

            # 复制新代码
            cp -r "$SOURCE_DIR"/* "$APP_DIR/"

            # 恢复配置
            cp /tmp/config.js.bak "$APP_DIR/config/config.js"
            cp /tmp/.env.bak "$APP_DIR/.env"
            rm -rf "$APP_DIR/data"
            cp -r /tmp/data.bak "$APP_DIR/data"

            log_info "代码已更新"
        fi
    else
        log_warn "无法下载最新代码，保持现有版本"
    fi
fi

# 4. 更新依赖
log_info "4/6 更新依赖..."
npm install --prefer-offline 2>&1 | tail -3

# 5. 构建前端
log_info "5/6 构建前端..."
npm run install:web 2>&1 | tail -3
npm run build:web 2>&1 | tail -5

# 6. 启动服务
log_info "6/6 启动服务..."
npm run service:start:daemon 2>&1 | tail -5

# 等待服务启动
sleep 5

# 验证
log_info "========================================"
log_info "部署完成!"
log_info "========================================"

# 检查版本
VERSION=$(cat "$APP_DIR/VERSION" 2>/dev/null || echo "unknown")
log_info "当前版本: $VERSION"

# 检查服务状态
if curl -sf http://127.0.0.1:3000/health > /dev/null 2>&1; then
    log_info "服务状态: ✅ 运行正常"
else
    log_error "服务状态: ❌ 启动失败，请检查日志"
    tail -20 "$APP_DIR/logs/service.log" 2>/dev/null || tail -20 "$APP_DIR/logs/motel-api-$(date +%Y-%m-%d).log" 2>/dev/null
fi

# 显示访问地址
IP=$(curl -s ifconfig.me 2>/dev/null || echo "127.0.0.1")
log_info "访问地址: http://$IP:3000"
log_info "管理界面: http://$IP:3000/admin-next/api-stats"
log_info "备份文件: $BACKUP_FILE"