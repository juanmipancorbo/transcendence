#<-------------------------------|VARIABLES|---------------------------------->#

COMPOSE = docker compose

#<---------------------------------|FILES|------------------------------------>#

COMPOSE_FILE = ./compose.yaml

#<---------------------------------|RULES|------------------------------------>#

all: setup up

setup:
	@echo "Starting project..."
	@if [ ! -f backend/container/.env ] || [ ! -f frontend/.env ] || [ ! -f database/container/.env ]; then \
		echo "Starting setup-env wizard..."; \
		./setup-env.sh; \
	fi

up:
	${COMPOSE} -f ${COMPOSE_FILE} up -d --build
	# Refresh Docker DNS after frontend/backend containers may have been recreated.
	${COMPOSE} -f ${COMPOSE_FILE} restart nginx

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

.PHONY: all setup up down drop-db seed-db clean
