# jubelio-back

server is run on localhost port 3001, assuming PostgreSQL is running on local machine with internet connection (to fetch from Elevenia's API)

POST - /reset - generate table (or drop one if existed)

POST - /query-elevenia - query data and save to database

GET - / - query all

GET - /{:productNumber} - single query on product number

PUT - /{:productNumber} - single update on product number

DELETE - /{:productNumber} - single delete on product number
