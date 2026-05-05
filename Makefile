#<-------------------------------|VARIABLES|---------------------------------->#

COMPOSE = docker compose

#<---------------------------------|FILES|------------------------------------>#

COMPOSE_FILE = ./compose.yaml

#<---------------------------------|RULES|------------------------------------>#

all: setup up

setup:
	@echo seting up stuff

up:
	${COMPOSE} -f ${COMPOSE_FILE} up

rebuild:
	${COMPOSE} -f ${COMPOSE_FILE} up --build

down:
	${COMPOSE} -f ${COMPOSE_FILE} down

init-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run init-db

reset-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run reset-db

seed-db:
	${COMPOSE} -f ${COMPOSE_FILE} exec backend npm run seed-db