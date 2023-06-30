.PHONY: default
default: dev

.PHONY: dev
dev: 
	@echo "Building plug-in"
	npm install && npm run build
	@echo "Starting docker compose..."
	docker-compose up &
	npm run watch

RELEASE_FILE :=$(shell cat package.json | jq -r .name)-$(shell cat package.json | jq -r .version).zip

.PHONY: build-release
build-release: 
	npm run build
	cp package.json dist/
	npm run sign

	mv dist/ servicenow-cloud-observability-datasource
	
	mkdir -p releases
	zip -r "releases/$(RELEASE_FILE)" servicenow-cloud-observability-datasource
	rm -rf servicenow-cloud-observability-datasource

.PHONY: build-md5
build-md5:
	echo "$(shell md5 < releases/$(RELEASE_FILE))  $(RELEASE_FILE)" > releases/$(RELEASE_FILE).md5
