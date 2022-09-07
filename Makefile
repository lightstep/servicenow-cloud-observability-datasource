.PHONY: default
default: dev

.PHONY: ensure-dependencies
ensure-dependencies:
	@which yarn || (echo "You must install yarn to build the plug-in" && false)

.PHONY: dev
dev: ensure-dependencies
	@echo "Creating local Docker storage volume if not present"
	-docker volume create grafana-data-lmd
	@echo "Building plug-in"
	yarn install && yarn build
	@echo "Starting docker compose..."
	docker-compose up