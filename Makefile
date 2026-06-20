#<-------------------------------|VARIABLES|---------------------------------->#

COMPOSE = docker compose

#<---------------------------------|FILES|------------------------------------>#

COMPOSE_FILE = ./compose.yaml

#<---------------------------------|RULES|------------------------------------>#

all: setup up

setup:
	@echo "Starting project..."
	@if [ ! -f backend/container/.env ]; then \
		echo "Creating backend/.env from backend/.env.example..."; \
		./setup-env.sh; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Creating frontend/.env from frontend/.env.example..."; \
		cp frontend/.env.example frontend/.env; \
	fi
	@if [ ! -f nginx/certs/cert.pem ]; then \
		echo "Generating SSL certificates..."; \
		mkdir -p nginx/certs; \
		openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout nginx/certs/key.pem \
			-out nginx/certs/cert.pem \
			-subj "/CN=localhost"; \
	fi

up:
	${COMPOSE} -f ${COMPOSE_FILE} up -d --build

#rebuild:
#	${COMPOSE} -f ${COMPOSE_FILE} up --build

down:
	${COMPOSE} -f ${COMPOSE_FILE} down

drop-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run drop-db

seed-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run seed-db

clean:
	${COMPOSE} down -v

re: clean up
