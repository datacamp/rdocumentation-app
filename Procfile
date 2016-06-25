web: node --optimize_for_size --max_old_space_size=460 --gc_interval=100 node_modules/sails/bin/sails lift
dev: nodemon node_modules/sails/bin/sails debug
debug: node -r dotenv/config node_modules/sails/bin/sails debug
console: node -r dotenv/config node_modules/sails/bin/sails console
clean-task: grunt sails_tasks:authorCleaning
recover-maintainers: grunt sails_tasks:maintainerRecover
index-stats: grunt sails_tasks:indexStats
