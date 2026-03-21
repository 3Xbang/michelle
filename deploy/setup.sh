#!/usr/bin/env bash
#
# Mira (Villa PMS) - EC2 一键部署脚本
#
# 项目名: mira
# 端口:   4000 (后端 API，内部)
# 访问:   http://100.51.160.4/mira/
# 数据库: mira_db
# PM2:    mira
# 路径:   /var/www/mira
#
# ⚠️  不会影响 EC2 上已有的其他项目
#
# 用法: sudo bash deploy/setup.sh
#
set -euo pipefail

# ============================================================
# 配置区 - 按需修改
# ============================================================
APP_NAME="mira"
APP_DIR="/var/www/mira"
REPO_URL="https://github.com/3Xbang/michelle.git"
BRANCH="main"

DB_NAME="mira_db"
DB_USER="mira"
DB_PASS="$(openssl rand -base64 24)"   # 自动生成随机密码

JWT_SECRET="$(openssl rand -base64 32)"
PORT=4000

# 你的域名或 EC2 公网 IP（Nginx server_name 用）
DOMAIN="100.51.160.4 ec2-100-51-160-4.compute-1.amazonaws.com"

# ============================================================
# 颜色输出
# ============================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[MIRA]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# 0. 前置检查
# ============================================================
log "检查运行环境..."
[[ $EUID -ne 0 ]] && err "请用 sudo 运行此脚本"

# ============================================================
# 1. 安装系统依赖（如果还没装的话）
# ============================================================
log "检查并安装系统依赖..."

# Node.js (如果没有就装 LTS)
if ! command -v node &>/dev/null; then
  log "安装 Node.js 20.x LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  log "Node.js 已安装: $(node -v)"
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  log "安装 PM2..."
  npm install -g pm2
else
  log "PM2 已安装: $(pm2 -v)"
fi

# PostgreSQL
if ! command -v psql &>/dev/null; then
  log "安装 PostgreSQL..."
  apt-get update
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
else
  log "PostgreSQL 已安装: $(psql --version)"
fi

# Nginx
if ! command -v nginx &>/dev/null; then
  log "安装 Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
else
  log "Nginx 已安装: $(nginx -v 2>&1)"
fi

# ============================================================
# 2. 创建 PostgreSQL 数据库和用户（独立的，不影响其他项目）
# ============================================================
log "配置 PostgreSQL 数据库: ${DB_NAME} / 用户: ${DB_USER}..."

# 检查用户是否已存在
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  warn "数据库用户 ${DB_USER} 已存在，跳过创建"
else
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  log "创建数据库用户 ${DB_USER}"
fi

# 检查数据库是否已存在
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  warn "数据库 ${DB_NAME} 已存在，跳过创建"
else
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  log "创建数据库 ${DB_NAME}"
fi

# ============================================================
# 3. 克隆代码
# ============================================================
log "部署代码到 ${APP_DIR}..."

if [ -d "${APP_DIR}" ]; then
  warn "${APP_DIR} 已存在，执行 git pull..."
  cd "${APP_DIR}"
  git pull origin "${BRANCH}"
else
  git clone -b "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
fi

# ============================================================
# 4. 创建 .env 文件
# ============================================================
log "生成 server/.env 配置文件..."

cat > "${APP_DIR}/server/.env" <<EOF
PORT=${PORT}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
EOF

log ".env 文件已生成"

# ============================================================
# 5. 安装依赖
# ============================================================
log "安装后端依赖..."
cd "${APP_DIR}/server"
npm ci --production=false

log "安装前端依赖..."
cd "${APP_DIR}/client"
npm ci

# ============================================================
# 6. 运行数据库迁移和种子数据
# ============================================================
log "执行数据库迁移..."
cd "${APP_DIR}"
node server/scripts/migrate.js

log "插入种子数据..."
node server/scripts/seed.js

# ============================================================
# 7. 构建前端
# ============================================================
log "构建前端..."
cd "${APP_DIR}/client"
npx vite build

# ============================================================
# 8. 创建必要目录
# ============================================================
log "创建日志和上传目录..."
mkdir -p /var/log/mira
mkdir -p "${APP_DIR}/server/uploads"
mkdir -p /var/backups/mira

# ============================================================
# 9. 配置 PM2（进程名 mira，端口 3001，不影响其他 PM2 进程）
# ============================================================
log "配置 PM2 进程: ${APP_NAME} (端口 ${PORT})..."

# 先停掉旧的（如果有）
pm2 delete "${APP_NAME}" 2>/dev/null || true

cd "${APP_DIR}"
pm2 start ecosystem.config.js
pm2 save

# 设置 PM2 开机自启（如果还没设置过）
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ============================================================
# 10. 配置 Nginx（注入 location block 到现有配置，不创建独立 server）
# ============================================================
log "配置 Nginx..."

# 检查是否已经注入过 mira 配置
NGINX_DEFAULT="/etc/nginx/sites-available/default"
if grep -q "# Mira - 前端 SPA 静态文件" "${NGINX_DEFAULT}" 2>/dev/null; then
  warn "Nginx 中已有 mira 配置，跳过注入"
else
  # 提取 location blocks（跳过注释头部）
  MIRA_LOCATIONS=$(sed -n '/^# Mira - 前端/,$ p' "${APP_DIR}/deploy/nginx.conf" | sed '/^# ---- 粘贴结束/d')

  # 在 server block 的最后一个 } 之前插入
  # 先备份
  cp "${NGINX_DEFAULT}" "${NGINX_DEFAULT}.bak.$(date +%Y%m%d%H%M%S)"
  log "已备份原 Nginx 配置"

  # 用 sed 在最后一个 } 之前插入 mira location blocks
  # 创建临时文件
  TEMP_CONF=$(mktemp)
  # 找到最后一个 } 的行号，在它之前插入
  LAST_BRACE=$(grep -n "^}" "${NGINX_DEFAULT}" | tail -1 | cut -d: -f1)
  if [ -n "${LAST_BRACE}" ]; then
    head -n $((LAST_BRACE - 1)) "${NGINX_DEFAULT}" > "${TEMP_CONF}"
    echo "" >> "${TEMP_CONF}"
    echo "    ${MIRA_LOCATIONS}" >> "${TEMP_CONF}"
    echo "" >> "${TEMP_CONF}"
    tail -n +"${LAST_BRACE}" "${NGINX_DEFAULT}" >> "${TEMP_CONF}"
    mv "${TEMP_CONF}" "${NGINX_DEFAULT}"
  else
    err "找不到 Nginx 配置中的 server block 结束符 }"
  fi

  log "已注入 mira location blocks 到 ${NGINX_DEFAULT}"
fi

# 检查 Nginx 配置
nginx -t || err "Nginx 配置检查失败，请手动检查 ${NGINX_DEFAULT}"

# 重载 Nginx
systemctl reload nginx

# ============================================================
# 11. 配置备份 cron（独立的 cron 任务）
# ============================================================
log "配置数据库备份 cron..."
chmod +x "${APP_DIR}/server/scripts/backup.sh"

# 添加 cron（每天凌晨 2 点，独立标记避免和其他项目混）
CRON_CMD="0 2 * * * ${APP_DIR}/server/scripts/backup.sh >> /var/log/mira/backup.log 2>&1"
CRON_MARKER="# mira-backup"

# 检查是否已存在
if crontab -l 2>/dev/null | grep -q "${CRON_MARKER}"; then
  warn "备份 cron 已存在，跳过"
else
  (crontab -l 2>/dev/null; echo "${CRON_CMD} ${CRON_MARKER}") | crontab -
  log "备份 cron 已添加"
fi

# ============================================================
# 12. 完成
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN} Mira (Villa PMS) 部署完成！${NC}"
echo "============================================================"
echo ""
echo "  项目路径:  ${APP_DIR}"
echo "  后端端口:  ${PORT}"
echo "  PM2 进程:  ${APP_NAME}"
echo "  数据库:    ${DB_NAME} (用户: ${DB_USER})"
echo "  Nginx:     注入到 /etc/nginx/sites-available/default"
echo "  访问地址:  http://100.51.160.4/mira/"
echo "  日志:      /var/log/mira/"
echo "  备份:      /var/backups/mira/ (每天 2:00 AM)"
echo ""
echo "  数据库密码: ${DB_PASS}"
echo "  JWT 密钥:   ${JWT_SECRET}"
echo ""
echo -e "${YELLOW}  ⚠️  请保存上面的密码和密钥！${NC}"
echo ""
echo "  常用命令:"
echo "    pm2 status              # 查看所有 PM2 进程"
echo "    pm2 logs mira           # 查看 mira 日志"
echo "    pm2 restart mira        # 重启 mira"
echo "    pm2 stop mira           # 停止 mira"
echo ""
echo "  更新部署:"
echo "    cd ${APP_DIR} && git pull && npm ci --prefix server && npm ci --prefix client && npx --prefix client vite build && pm2 restart mira"
echo ""
