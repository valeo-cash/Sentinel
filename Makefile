.PHONY: dev build test seed docker-up docker-down publish-sdk

dev:
	pnpm --filter sentinel-app dev

build:
	pnpm --filter @x402sentinel/x402 build && pnpm --filter sentinel-app build

test:
	pnpm --filter @x402sentinel/x402 test

seed:
	pnpm --filter sentinel-app db:seed

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

publish-sdk:
	pnpm --filter @x402sentinel/x402 publish --access public
