import * as fbChatApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import * as _ from "lodash";
import {Incident} from "incident";
import {EventEmitter} from "events";

import * as Pltr from "palantiri-interfaces";
import {FacebookConnection} from "./facebook-connection";

const DRIVER_NAME: string = "facebook";

function fbThreadToPltrDiscussion (thread: fbChatApi.Thread): Pltr.Discussion {
  return {
    id: thread.threadID,
    driverName: DRIVER_NAME,
    creationDate: thread.timestamp,
    name: thread.name,
    description: thread.snippet,
    isPrivate: true,
    participants: [],
    owner: null, // TODO: Is there an owner ?
    authorizations: {
      write: thread.readOnly,
      talk: thread.canReply,
      video: true,
      invite: true,
      kick: false,
      ban: false
    },
    driverData: thread
  }
}

export class FacebookApi extends EventEmitter implements Pltr.Api {
  nativeApi: fbChatApi.Api = null;
  connection: FacebookConnection = null;
  user: Pltr.UserAccount = null;

  constructor (nativeApi: fbChatApi.Api, nativeCurrentUser: fbChatApi.UserInfo, connection: FacebookConnection) {
    super();
    this.nativeApi = nativeApi;
    this.connection = connection;

    this.user = {
      driverName: DRIVER_NAME,
      id: String(this.nativeApi.getCurrentUserID()),
      avatarUrl: nativeCurrentUser.thumbSrc,
      name: nativeCurrentUser.name,
      driverData: nativeCurrentUser
    };

    this.nativeApi.listen((err, ev) => {
      this.handleNativeEvent(ev);
    })
  }

  handleNativeEvent (nativeEvent: fbChatApi.BaseEvent) {
    switch (nativeEvent.type) {
      case "message": return this.handleMessageEvent(<fbChatApi.MessageEvent> nativeEvent);
      default:
        console.log(nativeEvent);
    }
  }

  handleMessageEvent (nativeEvent: fbChatApi.MessageEvent) {
    let event: Pltr.Api.events.MessageEvent;

    // TODO: remove it once WebStorm stops to complain...
    //noinspection TypeScriptValidateTypes
    event = {
      type: Pltr.Api.events.MESSAGE,
      message: {
        id: String(nativeEvent.messageID),
        driverName: DRIVER_NAME,
        author: null,
        body: nativeEvent.body,
        content: nativeEvent.body,
        flags: 0,
        creationDate: new Date(Date.now()),
        lastUpdated: null,
        driverData: nativeEvent
      },
      discussionGlobalId: Pltr.Id.stringifyReference({driverName: DRIVER_NAME, id: String(nativeEvent.threadID)})
    };
    this.emit(Pltr.Api.events.MESSAGE, event);
  }

  addMembersToDiscussion(members: Array<Pltr.AccountReference | Pltr.AccountGlobalId>, discussion: Pltr.DiscussionReference | Pltr.DiscussionGlobalId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (member) => {
        let memberRef = Pltr.Id.asReference(member, DRIVER_NAME);
        let discussionRef = Pltr.Id.asReference(discussion, DRIVER_NAME);
        return Bluebird.fromCallback(this.nativeApi.addUserToGroup.bind(null, memberRef.id, discussionRef.id)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  createDiscussion(members: Array<Pltr.AccountReference | Pltr.AccountGlobalId>, options?: Pltr.Api.CreateDiscussionOptions): Bluebird<Pltr.Discussion> {
    let discussionPromise: Bluebird<Pltr.Discussion>;

    if ((!Array.isArray(members)) ||members.length === 0) {
      discussionPromise = Bluebird.reject("No members provided to create discussion");
    } else if (members.length === 1) {
      console.warn("WE ARE NOT CREATING A NEW DISCUSSION BUT RESOLVING AN OLDER PRIVATE DISCUSSION");
      discussionPromise = Bluebird
        .try(() => {
          let memberIds: string[] = _.map(members, (member) => Pltr.Id.asReference(member, DRIVER_NAME).id);
          let pltrDiscu: Pltr.Discussion;
          pltrDiscu = {
            id: memberIds[0],
            driverName: DRIVER_NAME,
            creationDate: null,
            name: memberIds[0],
            description: "private discussion",
            isPrivate: true,
            participants: [],
            owner: null,
            authorizations: {
              write: true,
              talk: true,
              video: true,
              invite: true,
              kick: false,
              ban: false
            },
            driverData: {}
          };
          return this.loadParticipants(pltrDiscu, memberIds);
        })
        .then((discu: Pltr.Discussion) => {
          discu.name = discu.participants[0].name;
          return discu;
        })
    } else {
      // case with many members
      discussionPromise = Bluebird
        .try(() => {
          let memberIds: string[] = _.map(members, (member) => Pltr.Id.asReference(member, DRIVER_NAME).id);

          let msg: fbChatApi.Message = {
            body: "new-chat-" + Date.now()
          };
          let target: string | string[] =  memberIds.length === 1 ? memberIds[0] : memberIds;
          return Bluebird.fromCallback((cb: Function) => {
            this.nativeApi.sendMessage(msg, target, function(err, info) {
              if (err) {
                return cb (new Error(err.error));
              }
              cb (null, info);
            });
          }); // TODO: normalize errors
        })
        .then((messageInfo: fbChatApi.MessageInfo) => {
          return this.getDiscussion(messageInfo.threadID);
        });
    }

    return discussionPromise
      .then((discu: Pltr.Discussion) => {
        if(discu && discu.participants) {
          discu.participants = _.filter(discu.participants, (participant: Pltr.Account) => {
            console.log(this.user.id);
            console.log(participant.id);
            return participant.id !== this.user.id;
          });
        }
        return discu;
      });
  }

  getAccount(account: Pltr.AccountReference | Pltr.AccountGlobalId): Bluebird<Pltr.Account> {
    return Bluebird
      .try(() => {
        let accountRef = Pltr.Id.asReference(account, DRIVER_NAME);

        return Bluebird
          .fromCallback(this.nativeApi.getUserInfo.bind(null, [accountRef.id]))
          .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
            let msg: string = (<Error>error).message || (<fbChatApi.ErrorObject>error).error;
            return Bluebird.reject(new Error(msg));
          })
          .then((results: {[id: string]: fbChatApi.UserInfo}) => {
            let nativeInfo = results[accountRef.id];
            let account: Pltr.Account = {
              driverName: DRIVER_NAME,
              id: String(accountRef.id),
              avatarUrl: nativeInfo.thumbSrc,
              name: nativeInfo.name,
              driverData: nativeInfo
            };
            return account;
          });
      });
  }

  getContacts(options?: any): Bluebird<Pltr.Account[]> {
    return Bluebird.fromCallback(this.nativeApi.getFriendsList)
      .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
        let msg: string = (<Error>error).message || (<fbChatApi.ErrorObject>error).error;
        return Bluebird.reject(new Error(msg));
      })
      .map((friend: fbChatApi.Friend) => {
        let contactAccount: Pltr.Account;
        contactAccount = {
          driverName: DRIVER_NAME,
          id: String(friend.userID),
          avatarUrl: friend.profilePicture,
          name: friend.fullName,
          driverData: friend
        };
        return contactAccount;
      });
  }

  getCurrentUser(): Bluebird<Pltr.UserAccount> {
    return Bluebird.resolve(this.user);
  }

  /**
   * PROTECTED
   * Returns the information associated to a thread from a threadID
   * @param threadID
   */
  protected getDiscussion(threadID: string): Bluebird<Pltr.Discussion> {
    return Bluebird.fromCallback(this.nativeApi.getThreadInfo.bind(null, threadID)) // TODO: normalize errors
      .then((threadInfo: fbChatApi.GetThreadInfoResult) => {
        let pltrDiscu: Pltr.Discussion = {
          id: threadID,
          driverName: DRIVER_NAME,
          creationDate: null, // TODO: fix this
          name: threadInfo.name,
          description: threadInfo.snippet, // TODO: check
          isPrivate: true,
          participants: [], // TODO: fix this
          owner: null, // TODO: Is there an owner ?
          authorizations: {
            write: true, // TODO: fix this
            talk: true, // TODO: fix this
            video: true,
            invite: true,
            kick: false,
            ban: false
          },
          driverData: threadInfo
        };
        return pltrDiscu;
      });
  }

  protected loadParticipants (pltrDiscu: Pltr.Discussion, participantIds: string[]): Bluebird<Pltr.Discussion> {
    console.log(participantIds);
    return Bluebird
      .map(participantIds, ((id: string) => {
        return this.getAccount({driverName: DRIVER_NAME, id: id});
      }))
      .then((participants: Pltr.Account[]) => {
        pltrDiscu.participants = participants;
        return pltrDiscu;
      });
  }

  getDiscussions(options?: Pltr.Api.GetDiscussionsOptions): Bluebird<Pltr.Discussion[]> {
    let defaultOptions: Pltr.Api.GetDiscussionsOptions = {
      max: null,
      filter: null
    };
    options = _.assign({}, options, defaultOptions);

    return Bluebird.fromCallback(this.nativeApi.getThreadList.bind(null, 0, options.max))
      .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
        let msg: string = (<Error> error).message || (<fbChatApi.ErrorObject> error).error;
        return Bluebird.reject(new Error(msg));
      })
      .map((fbThread: fbChatApi.Thread) => {
        let pltrDiscu: Pltr.Discussion = fbThreadToPltrDiscussion(fbThread);
        return this.loadParticipants(pltrDiscu, fbThread.participantIDs);
      })
      .map((discu: Pltr.Discussion) => {
        if(discu && discu.participants) {
          discu.participants = _.filter(discu.participants, (participant: Pltr.Account) => {
            console.log(this.user.id);
            console.log(participant.id);
            return participant.id !== this.user.id;
          });
        }
        return discu;
      })
      .filter((discussion: Pltr.Discussion) => {
        if (!options.filter) {
          return Bluebird.resolve(true);
        }
        return Bluebird.resolve(options.filter(discussion));
      });
  }

  getMessagesFromDiscussion(discussion: Pltr.DiscussionReference | Pltr.DiscussionGlobalId, options?: Pltr.Api.GetMessagesFromDiscussionOptions): Bluebird<Pltr.Message[]> {
    return Bluebird.reject(new Incident("todo", "FbApi:getMessagesFromDiscussion is not implemented"));
  }

  leaveDiscussion(discussion: Pltr.DiscussionReference | Pltr.DiscussionGlobalId, options?: any): Bluebird<this> {
    return Bluebird.reject(new Incident("todo", "FbApi:leveDiscussion is not implemented"));
  }

  removeMembersFromDiscussion(members: Array<Pltr.AccountReference | Pltr.AccountGlobalId>, discussion: Pltr.DiscussionReference | Pltr.DiscussionGlobalId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (member) => {
        let memberRef = Pltr.Id.asReference(member, DRIVER_NAME);
        let discussionRef = Pltr.Id.asReference(discussion, DRIVER_NAME);
        return Bluebird.fromCallback(this.nativeApi.removeUserFromGroup.bind(null, memberRef.id, discussionRef.id)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  sendMessage(message: Pltr.Api.NewMessage, discussion: Pltr.DiscussionReference | Pltr.DiscussionGlobalId, options?: any): Bluebird<Pltr.Message> {
    return Bluebird
      .try(() => {
        let discussionRef = Pltr.Id.asReference(discussion, DRIVER_NAME);
        let fbMessage: fbChatApi.Message = {
          body: message.body
        };
        return Bluebird.fromCallback(this.nativeApi.sendMessage.bind(null, fbMessage, discussionRef.id));
      })
      .then((messageInfo: fbChatApi.MessageInfo) => {
        let result: Pltr.Message;

        // TODO: remove once webstorm is fixed...
        // noinspection TypeScriptValidateTypes
        result = {
          driverName: DRIVER_NAME,
          id: messageInfo.messageID,
          author: null,
          body: message.body,
          content: message.body,
          flags: 0,
          creationDate: new Date(parseInt(messageInfo.timestamp, 10)),
          lastUpdated: null,
          driverData: messageInfo
        };

        return result;
      });
  }
}
