web: node --optimize_for_size --max_old_space_size=1024 --gc_interval=100 app.js
dev: nodemon -r dotenv/config node_modules/sails/bin/sails debug
migrate: node -r dotenv/config node_modules/db-migrate/bin/db-migrate up
debug: node -r dotenv/config node_modules/sails/bin/sails debug
console: node -r dotenv/config node_modules/sails/bin/sails console
clean-task: grunt sails_tasks:authorCleaning
recover-maintainers: grunt sails_tasks:maintainerRecover
index-stats: grunt sails_tasks:indexStats
