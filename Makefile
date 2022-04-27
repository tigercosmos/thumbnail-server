all:
	docker-compose up --build

test:
	docker-compose -f docker-compose-test.yml up --build
