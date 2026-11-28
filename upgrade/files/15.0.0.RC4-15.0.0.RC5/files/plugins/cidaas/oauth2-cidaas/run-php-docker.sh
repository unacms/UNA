#!/bin/bash

docker compose up --build -d

echo "Enter docker container using: 'docker exec -it cidaas-sdk-php_web_1 sh'"
# echo "Run 'cd /var/www/work; ./docker/install-composer.sh; ./compose.phar' to install composer with dependencies"
echo "Run tests with './vendor/bin/phpunit'"
echo "Shutdown docker container with 'docker-compose down --rmi local'"
