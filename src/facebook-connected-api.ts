import {EventEmitter} from "events";

import * as facebookApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import {ConnectedApi} from "palantiri-interfaces";
import {UserAccount} from "palantiri-interfaces";
import {Contact} from "palantiri";
import {Discussion} from "palantiri";
import {Message} from "palantiri-interfaces";

export class FacebookConnectedApi implements ConnectedApi {
  protocol: string;

  facebookApi: facebookApi.Api;

  isCompatibleWith(protocol: string): boolean {
    return this.protocol.toLowerCase() === protocol.toLowerCase();
  }

  getContacts(account: UserAccount): Bluebird.Thenable<Contact[]> {
		let contacts: Contact[] = [];

		if(this.facebookApi) {
			let friends: any[] = [];
			this.facebookApi.getFriendsList((err, people) => {
				if(!err) {
					friends = people;
				}
			});
			for(let friend of friends) {
				let contactAccount: Contact = new Contact();
				contactAccount.protocol = "facebook";
				contactAccount.fullname = friend.fullName;
				contactAccount.localID = friend.userID;
				contacts.push(contactAccount);
			}
		}
    return Bluebird.resolve(contacts);
  }

  getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Bluebird.Thenable<Discussion[]> {
    let discussions: Discussion[] = [];

		if(this.facebookApi) {
			let threadsList: any[] = [];
			this.facebookApi.getThreadList(0, max, (err, threads) => {
				if (!err) {
					threadsList = threads;
				}
			});
			for(let thread of threadsList) {
				let discuss: Discussion = new Discussion();
        discuss.protocol = "facebook";
        discuss.localDiscussionID = thread.threadID;
        discuss.creationDate = thread.timestamp;  // TODO : care of the format
				discuss.name = thread.name;
        discuss.description = thread.snippet;     // TODO : is that was snippet is ?
				discuss.isPrivate = true;
				discuss.participants = [];
        discuss.owner = account;
        discuss.authorizations = {
          write: thread.readOnly,
          talk: thread.canReply,
          video: true,
          invite: true,
          kick: false,
          ban: false
        };
        discuss.settings = {
          "participantsID": thread.participants,
          "blockedParticipants": thread.blockedParticipants,
          "lastMessageID": thread.lastMessageID
          // TODO : and so on
        };

				if(!filter || filter(discuss)) {
					discussions.push(discuss);
				}
			}
		}
    return Bluebird.resolve(discussions);
  }

  addMembersToGroupChat(members: ContactAccount[], groupChat: GroupAccount, callback?: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
    let err: Error = null;
    for(let member of members) {
      if(member.protocol.toLowerCase() === groupChat.protocol.toLowerCase() && member.localID && groupChat.localDiscussionID) {
        this.facebookApi.addUserToGroup(member.localID, groupChat.localDiscussionID, (error) => {
          if(!err) {
            err = error;
          }
        });
      } else if (!err) {
        err = new Error("At least one of the participants could not be added.");
      }
    }
    if(callback) {
      callback(err);
    }
    return Bluebird.resolve(this);
  }

  removeMembersFromGroupChat(members: ContactAccount[], groupChat: GroupAccount, callback?: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
    let err: Error = null;
    for(let member of members) {
      if(member.protocol.toLowerCase() === groupChat.protocol.toLowerCase() && member.localID && groupChat.localDiscussionID) {
        this.facebookApi.removeUserFromGroup(member.localID, groupChat.localDiscussionID, (error) => {
          if(!error) {
            err = error;
          }
        });
      } else if (!err) {
        err = new Error("At least one of the participants could not be added.");
      }
    }
    if(callback) {
      callback(err);
    }
    return Bluebird.resolve(this);
  }

  leaveGroupChat(group: GroupAccount, callback: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
    let err: Error = null;
    if(group.localDiscussionID) {
      this.facebookApi.deleteThread(group.localDiscussionID, (error) => {
        if(!error) {
          err = error;
        }
      });
    } else {
      err = new Error("Can not leave group...");
    }
    if(callback) {
      callback(err);
    }
    return Bluebird.resolve(this);
  }

  sendMessage(msg: Message, recipients: GroupAccount, callback?: (err: Error, succesM: Message) => any): Bluebird.Thenable<ConnectedApi> {
    let message: facebookApi.Message = {
      'body': msg.body,
      // TODO : other fields
    }


		let error: Error = null;
		if(recipients.localDiscussionID) {
			this.facebookApi.sendMessage(message, recipients.localDiscussionID, (err, info) => {
				if(err) {
					error = err;
				}
				if(callback) {
					callback(err, msg);
				}
			});
		} else {
			let ids: number[] = [];
			for(let recipAccount of recipients.members) {
				ids.push(recipAccount.localID);
			}
			this.facebookApi.sendMessage(message, ids, (err, info) => {
				if(err) {
					error = err;
				} else {
					recipients.localDiscussionID = +info.threadID;
				}
				if(callback) {
					callback(err, msg);
				}
			});
		}
    return Bluebird.resolve(this);
  }

}

// TODO : fix everything to use the new interfaces
// export class FacebookProxy implements interfaces.ConnectedApi {
// 	protocol: string;
//
// 	api: any;
//
// 	isCompatibleWith(protocol: string): boolean {
// 		return protocol.toLowerCase() === this.protocol.toLowerCase();
// 	}
//
// 	createConnection(account: UserAccount): Promise<Connection> {
// 		let connection: Connection = new OChatConnection();
// 		connection.connected = false;
// 		connection.emitter = new EventEmitter();
// 		connection.listeners = [];
// 		let facebookApi: any = null;
//
// 		let rl = readline.createInterface({
// 			input: process.stdin,
// 			output: process.stdout
// 		});
//
// 		// TODO : once the database will be fonctionnal, get IDs from it
// 		rl.question("email : ", function (mail: string) {
// 			rl.question("pass : ", function (passw: string) {
// 				login(
// 					{email: mail, password: passw},
// 					function callback (err, api) {
// 						if(!err) {
// 							connection.connected = true;
// 							facebookApi = api;
// 						} else {
// 							return;
// 						}
// 					}
// 				);
// 			});
// 		});
// 		this.api = facebookApi;
// 		return Promise.resolve(connection);
// 	}
//
// 	getContacts(account: UserAccount): Promise<Contact[]> {
// 		// TODO : the parameter seems useless
// 		let contacts: OChatContact[] = [];
//
// 		if(this.api) {
// 			let friends: any[] = [];
// 			this.api.getFriendsList((err, people) => {
// 				if(!err) {
// 					friends = people;
// 				}
// 			});
// 			for(let friend of friends) {
// 				let contact = new OChatContact();
// 				contact.fullname = friend.fullName;
// 				contact.nicknames.push(friend.fullName);
// 				let contactAccount: OChatContactAccount = new OChatContactAccount();
// 				contactAccount.protocol = "facebook";
// 				contactAccount.contactName = friend.fullName;
// 				contactAccount.localID = friend.userID;
// 				contact.accounts.push(contactAccount);
// 				contacts.push(contact);
// 			}
// 		}
//
// 		return Promise.resolve(contacts);
// 	}
//
// 	getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Promise<Discussion[]> {
// 		let discussions: OChatDiscussion[] = [];
//
// 		if(this.api) {
// 			let threadsList: any[] = [];
// 			this.api.getThreadList(0, max, (err, threads) => {
// 				if (!err) {
// 					threadsList = threads;
// 				}
// 			});
// 			for(let thread of threadsList) {
// 				let discuss: OChatDiscussion = new OChatDiscussion();
// 				discuss.name = thread.name;
// 				discuss.creationDate = null;
// 				discuss.isPrivate = true;
// 				discuss.description = thread.snippet; // TODO : is that was snippet is ?
// 				discuss.participants = [];
// 				discuss.settings = new Map<string, any>();
// 				discuss.settings.set("threadID", thread.threadID);
// 				discuss.settings.set("participantsID", thread.participantIDs);
// 				discuss.settings.set("canReply", thread.canReply);
// 				discuss.settings.set("blockedParticipants", thread.blockedParticipants);
// 				discuss.settings.set("lastMessageID", thread.lastMessageID);
// 				// TODO : and so on
// 				account.getOwner().then((owner) => {
// 					discuss.owner = owner;
// 				})
// 				let groupAccount: OChatGroupAccount = new OChatGroupAccount();
// 				groupAccount.protocol = "facebook";
// 				groupAccount.localDiscussionID = thread.threadID;
// 				for(let recipientID of thread.participantIDs) {
// 					let contactAccount : OChatContactAccount = new OChatContactAccount();
// 					contactAccount.protocol = "facebook";
// 					contactAccount.localID = recipientID;
// 					this.api.getUserInfo(recipientID, (err, map) => {
// 						if(!err) {
// 							contactAccount.contactName = map.get(recipientID).name;
// 							groupAccount.addMembers(contactAccount);
// 						}
// 					});
// 				}
// 				discuss.participants.push(groupAccount);
// 				if(!filter || filter(discuss)) {
// 					discussions.push(discuss);
// 				}
// 			}
// 		}
//
// 		return Promise.resolve(discussions);
// 	}
//
// 	sendMessage(msg: Message, recipients: GroupAccount, callback?: (err: Error, succesM: Message) => any): void {
// 		let message: any = undefined;
// 		if(msg.flags === MSG_FLAG_TXT || msg.flags === (MSG_FLAG_TXT & MSG_FLAG_EDI)) {
// 			message.type = "regular";
// 		} else if ((msg.flags & MSG_FLAG_IMG) === MSG_FLAG_IMG) {
// 			message.type = "image";
// 		} else if ((msg.flags & MSG_FLAG_FIL) === MSG_FLAG_FIL || (msg.flags & MSG_FLAG_VID) === MSG_FLAG_VID) {
// 			message.type = "file";
// 		} else if ((msg.flags & MSG_FLAG_URL) === MSG_FLAG_IMG) {
// 			message.type = "url";
// 		}
//
// 		// TODO : manage attachments with streams
//
// 		message.body = msg.body;
//
// 		let error: Error = null;
// 		if(recipients.localDiscussionID) {
// 			this.api.sendMessage(message, recipients.localDiscussionID, (err, info) => {
// 				if(err) {
// 					error = err;
// 				}
// 				if(callback) {
// 					callback(err, message);
// 				}
// 			});
// 		} else {
// 			let ids: number[] = [];
// 			for(let recipAccount of recipients.members) {
// 				ids.push(recipAccount.localID);
// 			}
// 			this.api.sendMessage(message, ids, (err, info) => {
// 				if(err) {
// 					error = err;
// 				} else {
// 					//recipients.localDiscussionID = info.threadID;
// 					// TODO : faire en sorte que le compilo et l'IDE comprennent que ça vient de manual_typings
// 				}
// 				if(callback) {
// 					callback(err, message);
// 				}
// 			});
// 		}
// 	}
// }
