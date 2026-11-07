.PHONY: dev build start lint format format-check test test-watch deploy clean

dev: ## Run the Next.js dev server
	npm run dev

build: ## Production build
	npm run build

start: ## Run the production build locally
	npm run start

lint: ## Lint with next lint
	npm run lint

format: ## Format all files with prettier
	npm run format

format-check: ## Check formatting without writing
	npm run format:check

test: ## Run the jest test suite once
	npm run test

test-watch: ## Run jest in watch mode
	npm run test:watch

deploy: ## Deploy to Vercel production
	vercel --prod

clean: ## Remove build artifacts
	rm -rf .next coverage
