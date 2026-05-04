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
	docker compose up --build

down:
	docker compose down

clean:
	docker compose down -v

re: clean up