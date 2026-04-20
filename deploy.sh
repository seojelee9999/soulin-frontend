#!/bin/bash
set -e

echo "=== soulin-frontend 배포 시작 ==="

# 1. 빌드
npm install
npm run build

# 2. 서버로 파일 전송 (서버 정보 수정 필요)
SERVER_USER="ubuntu"
SERVER_HOST="your-server-ip"
DEPLOY_PATH="/var/www/soulin-frontend"

echo "=== 서버로 전송 중... ==="
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $DEPLOY_PATH"
rsync -avz --delete dist/ $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/

# 3. Nginx 설정 복사 (최초 1회만)
# scp nginx.conf $SERVER_USER@$SERVER_HOST:/etc/nginx/sites-available/soulin-frontend
# ssh $SERVER_USER@$SERVER_HOST "ln -sf /etc/nginx/sites-available/soulin-frontend /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"

echo "=== 배포 완료! ==="
