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
    return Bluebird
      .try(() => {
        let membersIds: string[] = _.map(members, (member) => Pltr.Id.asReference(member, DRIVER_NAME).id);
        // TODO: do not send an empty string ?
        return Bluebird.fromCallback(this.nativeApi.sendMessage.bind(null, "", membersIds)); // TODO: normalize errors
      })
      .then((messageInfo: fbChatApi.MessageInfo) => {
        return this.getDiscussion(messageInfo.threadID);
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
              id: String(this.nativeApi.getCurrentUserID()),
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
        return {
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
        }
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
      .map(fbThreadToPltrDiscussion)
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
