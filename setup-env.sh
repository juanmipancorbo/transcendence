#!/bin/bash

set -eu
umask 077

DB_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -hex 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

sed \
    -e "s/^PGUSER=user_name$/PGUSER=ft_trans42/" \
    -e "s/^PGPASSWORD=user_password$/PGPASSWORD=$DB_PASSWORD/" \
    -e "s/^JWT_SECRET=change_me_to_a_long_random_secret$/JWT_SECRET=$JWT_SECRET/" \
    backend/container/.env.example > backend/container/.env


sed \
    -e "s/^POSTGRES_USER=user_name$/POSTGRES_USER=ft_trans42/" \
    -e "s/^POSTGRES_PASSWORD=user_password$/POSTGRES_PASSWORD=$DB_PASSWORD/" \
    database/container/.env.example > database/container/.env

echo "Created backend/container/.env and database/container/.env."
