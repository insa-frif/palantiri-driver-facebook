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
let bestFriend: any;

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

					console.log("Number of friends : " + data.length);
					for(let friend of data)
					{
						console.log(friend.fullName);
						if(friend.fullName === "Ruben Pericas")
						{
							bestFriend = friend;
						}
					}
				});

				console.log("Gettings 10 first thread's IDs...");
				api.getThreadList(0, 10, function(err, data) {
					if(err) return console.error(err);

					console.log("Number of threads : " + data.length);
					for(let thread of data)
					{
						console.log(thread.threadID);
						if(thread.participantIDs[0] === bestFriend.userID)
						{
							console.log("this is our best friend ! Let him know by sending him a message");
							api.sendMessage("You are my best friend !", thread.threadID, (err, info) => {
								if(!err)
								{
									console.log("Now our best friend knows !");
								}
								else
								{
									console.log("An error occured, our best friend still have no clue");
								}
							});
						}
					}
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


