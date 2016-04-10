/**
 * Created by Ruben on 10/04/2016.
 */

import * as login from "facebook-chat-api";
let readline = require('readline');

let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

let email: string;
let pass: string;

rl.question("email : ", function (mail: string) {
	email = mail;
	rl.question("pass : ", function (passw: string) {
		pass = passw;
		login(
			{email: email, password: pass},
			function callback (err, api) {
				if(err){
					return console.error(err.error);
				}

				console.log("Gettings number of friends...");
				api.getFriendsList(function(err, data) {
					if(err) return console.error(err);

					console.log("Number of friends :" + data.length);
				});

				console.log("Trying to echo...");
				api.listen(function callback(err, message) {
					console.log("Message received ! It's says : " + message.body);
					console.log("Echoing...");
					api.sendMessage(message.body, message.threadID);
					console.log("Echo done !");
				});
			}
		);
	});
});


