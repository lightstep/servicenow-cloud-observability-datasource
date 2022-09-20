.PHONY: default
default: dev

.PHONY: ensure-dependencies
ensure-dependencies:
	@which yarn || (echo "You must install yarn to build the plug-in" && false)

.PHONY: dev
dev: ensure-dependencies
	@echo "Creating local Docker storage volume if not present"
	-docker volume create grafana-data-lmd
	docker-compose down
	@echo "Building plug-in"
	yarn install && yarn build
	@echo "Starting docker compose..."
	docker-compose up &
	yarn watch

RELEASE_FILE :=$(shell cat package.json | jq -r .name)-$(shell cat package.json | jq -r .version).zip

.PHONY: build-release
build-release: 
	echo npm run build
	mkdir -p releases
	cd dist && zip -r "../releases/$(RELEASE_FILE)" *
	echo "$(shell md5 < releases/$(RELEASE_FILE))  $(RELEASE_FILE)" > releases/$(RELEASE_FILE).md5
