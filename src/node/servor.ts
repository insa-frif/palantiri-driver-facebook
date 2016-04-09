/**
 * Created by Ruben on 09/04/2016.
 */

let http = require("http");

let host = "127.0.0.1";
let port = 8080;

let servor = http.createServer( (req, res): void => {
	res.writeHead(200);
	res.write("Servor listening");
	res.end();
});

servor.listen(port, host, ():void => {
	console.log("Servor running at port http//" + host + ":" + port);
});