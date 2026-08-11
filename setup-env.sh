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

	# Serve a probe token so the wait below proves the challenge path really
	# works, instead of just succeeding on the HTTP->HTTPS redirect.
	mkdir -p nginx/acme-challenge/.well-known/acme-challenge
	# nginx workers serve this as an unprivileged user inside the container, so
	# the webroot has to be world-readable despite the umask 077 above.
	# (certbot already chmods the token files it writes here to 644.)
	chmod 755 nginx/acme-challenge \
	          nginx/acme-challenge/.well-known \
	          nginx/acme-challenge/.well-known/acme-challenge
	printf 'ok' > nginx/acme-challenge/.well-known/acme-challenge/setup-probe
	chmod 644 nginx/acme-challenge/.well-known/acme-challenge/setup-probe

	docker compose up -d nginx
	echo "Waiting for nginx to serve the ACME challenge path..."
	ready=""
	for _ in $(seq 30); do
		if [ "$(curl -fsSL "http://$DOMAIN_NAME/.well-known/acme-challenge/setup-probe" 2>/dev/null)" = "ok" ]; then
			ready=1
			break
		fi
		sleep 1
	done
	rm -f nginx/acme-challenge/.well-known/acme-challenge/setup-probe

	[ -n "$ready" ] || {
		echo "nginx is not serving http://$DOMAIN_NAME/.well-known/acme-challenge/" >&2
		echo "Check that $DOMAIN_NAME resolves here and that port 80 is reachable." >&2
		exit 1
	}

	certbot certonly --webroot -w "$PWD/nginx/acme-challenge" \
		-d "$DOMAIN_NAME" \
		-m "$ACME_EMAIL" \
		--agree-tos --non-interactive \
		--config-dir "$PWD/letsencrypt/config" \
		--work-dir  "$PWD/letsencrypt/work" \
		--logs-dir  "$PWD/letsencrypt/logs" \
		--deploy-hook "cp \"\$RENEWED_LINEAGE/fullchain.pem\" $PWD/nginx/certs/cert.pem && \
		               cp \"\$RENEWED_LINEAGE/privkey.pem\"   $PWD/nginx/certs/key.pem && \
		               chmod 644 $PWD/nginx/certs/cert.pem && \
		               docker compose -f $PWD/compose.yaml exec -T nginx nginx -s reload"

	cp "$PWD/letsencrypt/config/live/$DOMAIN_NAME/fullchain.pem" nginx/certs/cert.pem
	cp "$PWD/letsencrypt/config/live/$DOMAIN_NAME/privkey.pem"   nginx/certs/key.pem
	chmod 644 nginx/certs/cert.pem

	# nginx still has the self-signed cert loaded until it re-reads the files.
	docker compose exec -T nginx nginx -s reload || docker compose restart nginx
fi
echo "Certificates in nginx/certs/{cert,key}.pem"
