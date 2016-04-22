import * as fbChatApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import {EventEmitter} from "events";

import {Api, Message, Account, DiscussionId, AccountId, Discussion} from "palantiri-interfaces";

export class FacebookApi extends EventEmitter implements Api {
  getContacts(options?: any): Bluebird<Account[]> {
    return null;
  }
  contactExists(account: Account): Bluebird<boolean> {
    return null;
  }
  getDiscussions(options?: Api.GetDiscussionsOptions): Bluebird<Discussion[]> {
    return null;
  }
  addMembersToDiscussion(members: AccountId[], discussion: DiscussionId, options?: any): Bluebird<this> {
    return null;
  }
  removeMembersFromDiscussion(members: AccountId[], discussion: DiscussionId, options?: any): Bluebird<this> {
    return null;
  }
  leaveDiscussion(discussion: DiscussionId, options?: any): Bluebird<Api> {
    return null;
  }
  sendMessage(msg: Api.NewMessage, discussion: DiscussionId, options?: any): Bluebird<Api> {
    return null;
  }

  // protocol: string;
  //
  // facebookApi: fbChatApi.Api;
  //
  // isCompatibleWith(protocol: string): boolean {
  //   return this.protocol.toLowerCase() === protocol.toLowerCase();
  // }
  //
  // getContacts(): Bluebird<Account[]> {
  //   let contacts: Account[] = [];
  //
  //   if(this.facebookApi) {
  //     let friends: any[] = [];
  //     this.facebookApi.getFriendsList((err, people) => {
  //       if(!err) {
  //         friends = people;
  //       }
  //     });
  //     for(let friend of friends) {
  //       let contactAccount: Contact = new Contact();
  //       contactAccount.protocol = "facebook";
  //       contactAccount.fullname = friend.fullName;
  //       contactAccount.localID = friend.userID;
  //       contacts.push(contactAccount);
  //     }
  //   }
  //   return Bluebird.resolve(contacts);
  // }
  //
  // getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Bluebird.Thenable<Discussion[]> {
  //   let discussions: Discussion[] = [];
  //
  //   if(this.facebookApi) {
  //     let threadsList: any[] = [];
  //     this.facebookApi.getThreadList(0, max, (err, threads) => {
  //       if (!err) {
  //         threadsList = threads;
  //       }
  //     });
  //     for(let thread of threadsList) {
  //       let discuss: Discussion = new Discussion();
  //       discuss.protocol = "facebook";
  //       discuss.localDiscussionID = thread.threadID;
  //       discuss.creationDate = thread.timestamp;  // TODO : care of the format
  //       discuss.name = thread.name;
  //       discuss.description = thread.snippet;     // TODO : is that was snippet is ?
  //       discuss.isPrivate = true;
  //       discuss.participants = [];
  //       discuss.owner = account;
  //       discuss.authorizations = {
  //         write: thread.readOnly,
  //         talk: thread.canReply,
  //         video: true,
  //         invite: true,
  //         kick: false,
  //         ban: false
  //       };
  //       discuss.settings = {
  //         "participantsID": thread.participants,
  //         "blockedParticipants": thread.blockedParticipants,
  //         "lastMessageID": thread.lastMessageID
  //         // TODO : and so on
  //       };
  //
  //       if(!filter || filter(discuss)) {
  //         discussions.push(discuss);
  //       }
  //     }
  //   }
  //   return Bluebird.resolve(discussions);
  // }
  //
  // addMembersToDiscussion(members: Contact[], discussion: Discussion, callback?: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
  //   let err: Error = null;
  //   for(let member of members) {
  //     if(member.protocol.toLowerCase() === discussion.protocol.toLowerCase() && member.localID && discussion.localDiscussionID) {
  //       this.facebookApi.addUserToGroup(member.localID, discussion.localDiscussionID, (error) => {
  //         if(!err) {
  //           err = error;
  //         }
  //       });
  //     } else if (!err) {
  //       err = new Error("At least one of the participants could not be added.");
  //     }
  //   }
  //   if(callback) {
  //     callback(err);
  //   }
  //   return Bluebird.resolve(this);
  // }
  //
  // removeMembersFromDiscussion(members: Contact[], discussion: Discussion, callback?: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
  //   let err: Error = null;
  //   for(let member of members) {
  //     if(member.protocol.toLowerCase() === discussion.protocol.toLowerCase() && member.localID && discussion.localDiscussionID) {
  //       this.facebookApi.removeUserFromGroup(member.localID, discussion.localDiscussionID, (error) => {
  //         if(!error) {
  //           err = error;
  //         }
  //       });
  //     } else if (!err) {
  //       err = new Error("At least one of the participants could not be added.");
  //     }
  //   }
  //   if(callback) {
  //     callback(err);
  //   }
  //   return Bluebird.resolve(this);
  // }
  //
  // leaveDiscussion(discussion: Discussion, callback: (err: Error) => any): Bluebird.Thenable<ConnectedApi> {
  //   let err: Error = null;
  //   if(discussion.localDiscussionID) {
  //     this.facebookApi.deleteThread(discussion.localDiscussionID, (error) => {
  //       if(!error) {
  //         err = error;
  //       }
  //     });
  //   } else {
  //     err = new Error("Can not leave discussion...");
  //   }
  //   if(callback) {
  //     callback(err);
  //   }
  //   return Bluebird.resolve(this);
  // }
  //
  // sendMessage(msg: Message, discussion: Discussion, callback?: (err: Error, succesM: Message) => any): Bluebird.Thenable<ConnectedApi> {
  //   let message: fbChatApi.Message = {
  //     'body': msg.body,
  //     // TODO : other fields
  //   };
  //   let error: Error = null;
  //   if(discussion.localDiscussionID) {
  //     this.facebookApi.sendMessage(message, discussion.localDiscussionID, (err, info) => {
  //       if(err) {
  //         error = err;
  //       }
  //       if(callback) {
  //         callback(err, msg);
  //       }
  //     });
  //   } else {
  //     let ids: number[] = [];
  //     for(let contact of discussion.participants) {
  //       ids.push(contact.localID);
  //     }
  //     this.facebookApi.sendMessage(message, ids, (err, info) => {
  //       if(err) {
  //         error = err;
  //       } else {
  //         discussion.localDiscussionID = +info.threadID;
  //       }
  //       if(callback) {
  //         callback(err, msg);
  //       }
  //     });
  //   }
  //   return Bluebird.resolve(this);
  // }

}
