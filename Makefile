#<-------------------------------|VARIABLES|---------------------------------->#

COMPOSE = docker compose

#<---------------------------------|FILES|------------------------------------>#

COMPOSE_FILE = ./compose.yaml

#<---------------------------------|RULES|------------------------------------>#

all: setup up

setup:
	@echo seting up stuff

up:
	@echo "Starting project..."
	@if [ ! -f nginx/certs/cert.pem ]; then \
		echo "Generating SSL certificates..."; \
		mkdir -p nginx/certs; \
		openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout nginx/certs/key.pem \
			-out nginx/certs/cert.pem \
			-subj "/CN=localhost"; \
	fi
	${COMPOSE} -f ${COMPOSE_FILE} up -d --build

#rebuild:
#	${COMPOSE} -f ${COMPOSE_FILE} up --build

down:
	${COMPOSE} -f ${COMPOSE_FILE} down

init-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run init-db

reset-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run reset-db

seed-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run seed-db

clean:
	${COMPOSE} down -v

re: clean up