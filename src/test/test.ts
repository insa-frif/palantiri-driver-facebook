import {EventEmitter} from 'events';
import * as readline from "readline";

import * as Bluebird from "bluebird";
import * as fbChat from "facebook-chat-api";

class FBEmitter extends EventEmitter {}

class FBConnection {
	emitter: FBEmitter;

	connect(){
		let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		let emitter = this.emitter;
		rl.question("email : ", function (mail: string) {
			let username = mail;
			rl.question("pass : ", function (passw: string) {
				let password = passw;

        let credentials: fbChat.Credentials = {email: username, password: password};

				fbChat(
					credentials,
					function callback (err: fbChat.ErrorObject, api: fbChat.Api) {
						if (err) {
							return console.error(err.error);
						}
						let bestFriendThread: string;
						api.getThreadList(0, 1, function(err: Error, data: fbChat.Thread[]) {
							if(err) return console.error(err);
							bestFriendThread = data[0].threadID;
						});
						api.listen((err: Error, event: fbChat.Event) => {
							if(err) {
								console.log("Can't echoing...");
								console.log(err);
                return null;
							}

              if (event.type === "message") {
                let messageEvent: fbChat.MessageEvent = <fbChat.MessageEvent> event;

                console.log("Message received ! It's says : " + messageEvent.body);
                console.log("Echoing...");
                console.log(messageEvent.threadID);
                api.sendMessage("J'ai recu ton message !", messageEvent.threadID);
                console.log("Echo done !");
              } else {
                console.log("unkown event type");
                console.log(event);
              }
						});
						rl.question("Say something to Ruben !", function (rep: string) {
							console.log("about to send " + rep + " to ruben...");
							emitter.emit('sendMsg', api, rep, bestFriendThread);
						})
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

	getOrCreateConnection(): Bluebird<FBConnection> {
		if(!this.connection)
		{
			this.connection = new FBConnection();
			this.connection.connect();
		}
		return Bluebird.resolve(this.connection);
	}
}

let acc = new FakeAccount();
acc.getOrCreateConnection().then((conn) => {
	// TODO : find a way tom import typings from manual_typings
	conn.addOneListener('sendMsg', (api: fbChat.Api, body: string, threadID: number) => {
		console.log("let's send " + body + " to ruben ! (" + threadID +")");
		api.sendMessage(body, threadID, (err, info) => {
			if(err)
			{
				console.log(err);
			}
			else
			{
				console.log(info);
				console.log("message send...");
			}
		});
	})
});
