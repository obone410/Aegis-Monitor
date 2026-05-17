.PHONY: install dev lint typecheck test audit build verify docker-build docker-run

install:
	npm ci

dev:
	npm run dev

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

audit:
	npm run audit:prod

build:
	npm run build

verify: lint typecheck test audit build

docker-build:
	docker build -t devops-monitoring-dashboard .

docker-run:
	docker run --rm -p 3000:3000 devops-monitoring-dashboard
