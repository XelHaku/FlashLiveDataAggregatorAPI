## STAGE

CANCELED
POSTPONED

FINISHED
AFTER_PENALTIES
AFTER_EXTRA_TIME
AWARDED

ABANDONED

## STAGE_TYPE

FINISHED
SCHEDULED
LIVE

## MERGE_STAGE_TYPE

FINISHED
SCHEDULED
LIVE

# WINNER

1
2

npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev

https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn

# find the process ID (PID) that's using the port

lsof -i :3000

# kill the process (replace PID with the actual process ID)

kill -9 PID
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8080)
kill -9 $(lsof -t -i:4000)

https://coderrocketfuel.com/article/create-and-deploy-an-express-rest-api-to-a-digitalocean-server

pm2
https://pm2.keymetrics.io/docs/usage/quick-start/
$ pm2 restart app_name
$ pm2 reload app_name
$ pm2 stop app_name
$ pm2 delete app_name
