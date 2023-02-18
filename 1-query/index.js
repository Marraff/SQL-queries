const { getClient } = require('./connect.js');
const http = require('http');
const url = require('url');
(async () => {

    
    const client = await getClient();
    const server = http.createServer(); 
    const address = { port: 8000, host: '0.0.0.0' };

    let requestHandler = async function (req, res) {
       
        const jsonResponse = (responseObject, responseCode = 200) => {
          res.writeHead(responseCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseObject,null,2));
         
        };
    
        const requestUrl = new URL(req.url, 'http://localhost:8080');
         
        if (requestUrl.pathname === '/v1/health') {
    
            
            const verzia = await client.query("SELECT VERSION();");
            prvy = verzia.rows
            const velkost = await client.query(`SELECT pg_database_size('dota2')/1024/1024 as dota2_db_size;`);
            druhy = velkost.rows

            prvy = prvy[0]
            druhy[0].dota2_db_size = parseInt(druhy[0].dota2_db_size)
            druhy = druhy[0]
            let spolu = Object.assign(prvy,druhy)
            let oba = Object.assign({"pgsql": spolu})
            jsonResponse(oba);
            
        }
    
    };

    server.on('request', requestHandler);

    server.listen(address.port, address.host);
    console.log(`Server beží na: http://${address.host}:${address.port}`);
  
  })();