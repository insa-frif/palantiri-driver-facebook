/**
 * Created by Ruben on 10/04/2016.
 */

import * as login from "facebook-chat-api";
let readline = require('readline');
//const EventEmitter = require('events');
import {EventEmitter} from 'events';

class FBEmitter extends EventEmitter {
}
class FBConnection {
	emitter: FBEmitter;

	connect(){
		let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.question("email : ", function (mail: string) {
			let username = mail;
			rl.question("pass : ", function (passw: string) {
				let password = passw;
				login(
					{email: username, password: password},
					function callback (err, api) {
						if (err) {
							return console.error(err.error);
						}
						api.listen(function callback(err, message) {
							if(err) {
								console.log("Can't echoing...");
								console.log(err);
							}
							else {
								console.log("Message received ! It's says : " + message.body);
								console.log("Echoing...");
								console.log(message.threadID);
								api.sendMessage("J'ai recu ton message !", message.threadID);
								console.log("Echo done !");
							}

						});
					}

				);
			});
		});
	}

	addOneListener(name: string, handler: (...args: any[]) => any): void {
		this.emitter.on(name, handler);
	}

	removeOneListener(name: string, handler: (...args: any[]) => any): void {
		this.emitter.removeListener(name, handler);
	}

	sendEvent(name: string, ...args: any[]): void {
		this.emitter.emit(name, args);
	}

	constructor() {
		this.emitter = new FBEmitter();
	}
}
class FakeAccount {
	username: string;
	password: string;
	connection: FBConnection;

	getOrCreateConnection(): Promise<FBConnection> {
		if(!this.connection)
		{
			this.connection = new FBConnection();
			this.connection.connect();
		}
		return Promise.resolve(this.connection);
	}
}


let acc = new FakeAccount();
acc.getOrCreateConnection();

//let rl = readline.createInterface({
//	input: process.stdin,
//	output: process.stdout
//});
//
//let email: string;
//let pass: string;
//let bestFriend: any;
//
//rl.question("email : ", function (mail: string) {
//	email = mail;
//	rl.question("pass : ", function (passw: string) {
//		pass = passw;
//		login(
//			{email: email, password: pass},
//			function callback (err, api) {
//				if(err){
//					return console.error(err.error);
//				}
//
//				console.log("Gettings number of friends...");
//				api.getFriendsList(function(err, data) {
//					if(err) return console.error(err);
//
//					console.log("Number of friends : " + data.length);
//					for(let friend of data)
//					{
//						console.log(friend.fullName);
//						if(friend.fullName === "Ruben Pericas")
//						{
//							bestFriend = friend;
//						}
//					}
//				});
//
//				console.log("Gettings 10 first thread's IDs...");
//				api.getThreadList(0, 10, function(err, data) {
//					if(err) return console.error(err);
//
//					console.log("Number of threads : " + data.length);
//					for(let thread of data)
//					{
//						console.log(thread.threadID);
//						// NB : we don't know if the user is 0 or 1... We must check all index in the lib
//						if(thread.participantIDs[1] === bestFriend.userID)
//						{
//							console.log("this is our best friend ! Let him know by sending him a message");
//							api.sendMessage("You are my best friend !", thread.threadID, (err, info) => {
//								if(!err)
//								{
//									console.log("Now our best friend knows !");
//								}
//								else
//								{
//									console.log("An error occured, our best friend still have no clue");
//								}
//							});
//						}
//					}
//				});
//
//				console.log("Trying to echo...");
//				api.listen(function callback(err, message) {
//					if(err) {
//						console.log("Can't echoing...");
//						console.log(err);
//					}
//					else {
//						console.log("Message received ! It's says : " + message.body);
//						console.log("Echoing...");
//						console.log(message.threadID);
//						api.sendMessage("J'ai recu ton message !", message.threadID);
//						console.log("Echo done !");
//					}
//
//				});
//			}
//		);
//	});
//});


