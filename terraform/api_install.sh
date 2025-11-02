#!/bin/bash

exec > >(tee /var/log/my_script.log) 2>&1

export DATABASE_URL="mysql://${db_username}:${db_password}@${db_endpoint}/${db_name}"
export PORT=5000
export AUTH_ISSUER=${auth_issuer}
export NODE_ENV=production
export APP_URL=${app_url}
export AUTH_CLIENT_ID=${auth_client_id}
export AUTH_CLIENT_SECRET=${auth_client_secret}

yum install -y git
yum install -y nodejs npm
mkdir -p /opt/api
git clone ${repo_url} /opt/api
cd /opt/api
npm install
npm run build
npm start
