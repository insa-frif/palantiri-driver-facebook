/**
 * Created by Ruben on 11/04/2016.
 */

import {Client} from "../core/interfaces";
import {Proxy} from "../core/interfaces";
import {User} from "../core/interfaces";
import {Contact} from "../core/interfaces";
import {Discussion} from "../core/interfaces";
import {UserAccount} from "../core/interfaces";
import {ContactAccount} from "../core/interfaces";
import {Message} from "../core/interfaces";
import {MSG_FLAG_EDI} from "../core/interfaces"
import {Connection} from "../core/interfaces";
import {OChatEmitter} from "../core/interfaces";
import {Listener} from "../core/interfaces";
import {OChatConnection} from "../core/OChat";
import * as login from "facebook-chat-api";
let readline = require('readline');

class FacebookProxy implements Proxy {
	protocol: string;

	connection: Connection;

	api: any; // TODO : find a way to import types from manual typings

	isCompatibleWith(protocol: string): boolean {
		return protocol === this.protocol;
	}

	getOrCreateConnection(account: UserAccount): Promise<Connection> {
		// TODO : the parameter is useless,
		//        since that it's the userAccount that
		//        call this methods, and that the userAccount
		//        has this proxy as attribute.
		if(this.connection) {
			if(this.connection.connected) {
				return Promise.resolve(this.connection);
			}
		}

		let connection: Connection = new OChatConnection();
		connection.connected = false;
		connection.emitter = new OChatEmitter();
		connection.listeners = [];
		let facebookApi: any = null;

		let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		// TODO : once the database will be fonctionnal, get IDs from it
		rl.question("email : ", function (mail: string) {
			rl.question("pass : ", function (passw: string) {
				login(
					{email: mail, password: passw},
					function callback (err, api) {
						if(!err) {
							connection.connected = true;
							facebookApi = api;
						} else {
							return;
						}
					}
				);
			});
		});
		this.api = facebookApi;
		this.connection = connection;
		return Promise.resolve(connection);
	}

	getContacts(account: UserAccount): Promise<Contact[]> {
		return undefined;
	}

	getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Promise<Discussion[]> {
		return undefined;
	}

	sendMessage(msg: Message, recipient: ContactAccount, callback?: (err: Error, succesM: Message) => any): void {
	}
}
