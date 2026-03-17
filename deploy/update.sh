#!/usr/bin/env bash
#
# Mira - 快速更新脚本（git pull + rebuild + restart）
# 用法: sudo bash /var/www/mira/deploy/update.sh
#
set -euo pipefail

APP_DIR="/var/www/mira"
APP_NAME="mira"

echo "[MIRA] 拉取最新代码..."
cd "${APP_DIR}"
git pull origin main

echo "[MIRA] 安装后端依赖..."
cd "${APP_DIR}/server"
npm ci --production=false

echo "[MIRA] 安装前端依赖..."
cd "${APP_DIR}/client"
npm ci

echo "[MIRA] 执行数据库迁移..."
cd "${APP_DIR}"
node server/scripts/migrate.js

echo "[MIRA] 构建前端..."
cd "${APP_DIR}/client"
npx vite build

echo "[MIRA] 重启 PM2 进程..."
pm2 restart "${APP_NAME}"

echo "[MIRA] 更新完成！"
pm2 status
