#!/bin/sh
set -eu
umask 077

# escape chars special in a sed replacement (delimiter |, & and backslash)
esc() { printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'; }

DB_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -hex 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

read -rp  "Specify google client ID: " GOOGLE_CLIENT_ID
read -rsp "Specify google client secret: " GOOGLE_CLIENT_SECRET; echo
read -rp  "Specify domain name for certificates (empty for self-signed): " DOMAIN_NAME
if [ -n "$DOMAIN_NAME" ]; then
	read -rp "Contact email for Let's Encrypt (can be any email): " ACME_EMAIL
	[ -n "$ACME_EMAIL" ] || { echo "email required" >&2; exit 1; }
fi

sed \
	-e "s|^PGUSER=user_name$|PGUSER=ft_trans42|" \
	-e "s|^PGPASSWORD=user_password$|PGPASSWORD=$(esc "$DB_PASSWORD")|" \
	-e "s|^JWT_SECRET=change_me_to_a_long_random_secret$|JWT_SECRET=$(esc "$JWT_SECRET")|" \
	-e "s|^GOOGLE_CLIENT_ID=replace_with_google_client_id$|GOOGLE_CLIENT_ID=$(esc "$GOOGLE_CLIENT_ID")|" \
	-e "s|^GOOGLE_CLIENT_SECRET=replace_with_google_client_secret$|GOOGLE_CLIENT_SECRET=$(esc "$GOOGLE_CLIENT_SECRET")|" \
	backend/container/.env.example > backend/container/.env

sed \
	-e "s|^POSTGRES_USER=user_name$|POSTGRES_USER=ft_trans42|" \
	-e "s|^POSTGRES_PASSWORD=user_password$|POSTGRES_PASSWORD=$(esc "$DB_PASSWORD")|" \
	database/container/.env.example > database/container/.env

sed \
	-e "s|^NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace_with_google_client_id$|NEXT_PUBLIC_GOOGLE_CLIENT_ID=$(esc "$GOOGLE_CLIENT_ID")|" \
	frontend/.env.example > frontend/.env

echo "Created backend/container/.env, database/container/.env and frontend/.env."

echo "Generating SSL certificates..."
mkdir -p nginx/certs nginx/acme-challenge

openssl req -x509 -nodes -days 365 \
	-newkey rsa:2048 \
	-keyout nginx/certs/key.pem \
	-out nginx/certs/cert.pem \
	-subj "/CN=${DOMAIN_NAME:-localhost}" \
	-addext "subjectAltName=DNS:${DOMAIN_NAME:-localhost},IP:127.0.0.1,IP:::1"

if [ -n "$DOMAIN_NAME" ]; then
	command -v certbot >/dev/null || { echo "certbot not installed" >&2; exit 1; }

	docker compose up -d nginx
	echo "Waiting for nginx..."
	for _ in $(seq 30); do
		curl -fsS "http://$DOMAIN_NAME/.well-known/acme-challenge/" >/dev/null 2>&1 && break
		sleep 1
	done

	certbot certonly --webroot -w "$PWD/nginx/acme-challenge" \
		-d "$DOMAIN_NAME" \
		-m "$ACME_EMAIL" \
		--agree-tos --non-interactive \
		--config-dir "$PWD/letsencrypt/config" \
		--work-dir  "$PWD/letsencrypt/work" \
		--logs-dir  "$PWD/letsencrypt/logs" \
		--deploy-hook "cp \"\$RENEWED_LINEAGE/fullchain.pem\" $PWD/nginx/certs/cert.pem && \
		               cp \"\$RENEWED_LINEAGE/privkey.pem\"   $PWD/nginx/certs/key.pem"

	cp "$PWD/letsencrypt/config/live/$DOMAIN_NAME/fullchain.pem" nginx/certs/cert.pem
	cp "$PWD/letsencrypt/config/live/$DOMAIN_NAME/privkey.pem"   nginx/certs/key.pem
	chmod 644 nginx/certs/cert.pem
fi
echo "Certificates in nginx/certs/{cert,key}.pem"
