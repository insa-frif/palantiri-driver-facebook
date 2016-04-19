/**
 * Created by Ruben on 11/04/2016.
 */

import {Client} from "../core/interfaces";
import {Proxy} from "../core/interfaces";
import {Contact} from "../core/interfaces";
import {Discussion} from "../core/interfaces";
import {UserAccount} from "../core/interfaces";
import {ContactAccount} from "../core/interfaces";
import {GroupAccount} from "../core/interfaces";
import {Message} from "../core/interfaces";
import {Connection} from "../core/interfaces";
import {Listener} from "../core/interfaces";
import {OChatConnection} from "../core/OChat";
import {OChatContact} from "../core/OChat";
import {OChatContactAccount} from "../core/OChat";
import {OChatDiscussion} from "../core/OChat";
import {MSG_FLAG_TXT} from "../core/interfaces";
import {MSG_FLAG_EDI} from "../core/interfaces";
import {MSG_FLAG_IMG} from "../core/interfaces";
import {MSG_FLAG_FIL} from "../core/interfaces";
import {MSG_FLAG_URL} from "../core/interfaces";
import * as login from "facebook-chat-api";
import {EventEmitter} from "events";
let readline = require('readline');

// TODO : find a way to import types from manual typings

export class FacebookProxy implements Proxy {
	protocol: string;

	api: any;

	isCompatibleWith(protocol: string): boolean {
		return protocol.toLowerCase() === this.protocol.toLowerCase();
	}

	createConnection(account: UserAccount): Promise<Connection> {
		let connection: Connection = new OChatConnection();
		connection.connected = false;
		connection.emitter = new EventEmitter();
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
		return Promise.resolve(connection);
	}

	getContacts(account: UserAccount): Promise<Contact[]> {
		// TODO : the parameter seems useless
		let contacts: OChatContact[] = [];

		if(this.api) {
			let friends: any[] = [];
			this.api.getFriendsList((err, people) => {
				if(!err) {
					friends = people;
				}
			});
			for(let friend of friends) {
				let contact = new OChatContact();
				contact.fullname = friend.fullName;
				contact.nicknames.push(friend.fullName);
				let contactAccount: OChatContactAccount = new OChatContactAccount();
				contactAccount.protocol = "facebook";
				contactAccount.contactName = friend.fullName;
				contactAccount.localID = friend.userID;
				contact.accounts.push(contactAccount);
				contacts.push(contact);
			}
		}

		return Promise.resolve(contacts);
	}

	getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Promise<Discussion[]> {
		let discussions: OChatDiscussion[] = [];

		if(this.api) {
			let threadsList: any[] = [];
			this.api.getThreadList(0, max, (err, threads) => {
				if (!err) {
					threadsList = threads;
				}
			});
			for(let thread of threadsList) {
				let discuss: OChatDiscussion = new OChatDiscussion();
				discuss.name = thread.name;
				discuss.creationDate = null;
				discuss.isPrivate = true;
				discuss.description = thread.snippet; // TODO : is that was snippet is ?
				discuss.participants = [];
				discuss.settings = new Map<string, any>();
				discuss.settings.set("threadID", thread.threadID);
				discuss.settings.set("participantsID", thread.participantIDs);
				discuss.settings.set("canReply", thread.canReply);
				discuss.settings.set("blockedParticipants", thread.blockedParticipants);
				discuss.settings.set("lastMessageID", thread.lastMessageID);
				// TODO : and so on
				//discuss.owner = account.; TODO : add UserAccont.getOwner()
				for(let recipientID of thread.participantIDs) {
					let contactAccount : OChatContactAccount = new OChatContactAccount();
					contactAccount.protocol = "facebook";
					contactAccount.localID = recipientID;
					this.api.getUserInfo(recipientID, (err, map) => {
						if(!err) {
							contactAccount.contactName = map.get(recipientID).name;
							let groupAccount: GroupAccount = new GroupAccount();
							groupAccount.protocol = "facebook";
							groupAccount.addMembers(contactAccount);
							discuss.participants.push(groupAccount);
							if(!filter || filter(discuss)) {
								discussions.push(discuss);
							}
						}
					});
				}
			}
		}

		return Promise.resolve(discussions);
	}

	sendMessage(msg: Message, recipients: GroupAccount, callback?: (err: Error, succesM: Message) => any): void {
		let message: any = undefined;
		if(msg.flags === MSG_FLAG_TXT || msg.flags === (MSG_FLAG_TXT & MSG_FLAG_EDI)) {
			message.type = "regular";
		} else if ((msg.flags & MSG_FLAG_IMG) === MSG_FLAG_IMG) {
			message.type = "image";
		} else if ((msg.flags & MSG_FLAG_FIL) === MSG_FLAG_FIL) {
			message.type = "file";
		} else if ((msg.flags & MSG_FLAG_URL) === MSG_FLAG_IMG) {
			message.type = "url";
		}

		message.id = 0;
	}
}
