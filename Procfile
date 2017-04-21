web: NODE_ENV=production PORT=5000 node app.js
dev: NODE_ENV=locals PORT=5000 node app.js
migrate: node -r dotenv/config node_modules/db-migrate/bin/db-migrate up
debug: node -r dotenv/config node_modules/sails/bin/sails debug
console: node -r dotenv/config node_modules/sails/bin/sails console
clean-task: grunt sails_tasks:authorCleaning
recover-maintainers: grunt sails_tasks:maintainerRecover
index-stats: grunt sails_tasks:indexStats
