import * as fbChatApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import * as _ from "lodash";
import {EventEmitter} from "events";

import * as palantiri from "palantiri-interfaces";
import {FacebookConnection} from "./facebook-connection";

export class FacebookApi extends EventEmitter implements palantiri.Api {
  nativeApi: fbChatApi.Api = null;
  connection: FacebookConnection = null;
  user: palantiri.UserAccount = null;

  constructor (nativeApi: fbChatApi.Api, nativeCurrentUser: fbChatApi.UserInfo, connection: FacebookConnection) {
    super();
    this.nativeApi = nativeApi;
    this.connection = connection;

    this.user = {
      driverName: "facebook",
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
    let event: palantiri.Api.events.MessageEvent;

    // TODO: remove it once WebStorm stops to complain...
    //noinspection TypeScriptValidateTypes
    event = {
      type: palantiri.Api.events.MESSAGE,
      message: {
        id: String(nativeEvent.messageID),
        driverName: "facebook",
        author: null,
        body: nativeEvent.body,
        content: nativeEvent.body,
        flags: 0,
        creationDate: new Date(Date.now()),
        lastUpdated: null,
        driverData: nativeEvent
      },
      discussionId: String(nativeEvent.threadID)
    };
    this.emit(palantiri.Api.events.MESSAGE, event);
  }

  getAccountInfo(account: palantiri.AccountReference | palantiri.AccountGlobalId): Bluebird<palantiri.Account> {
    return Bluebird
      .try(() => {
        let accountRef: palantiri.AccountReference = palantiri.GlobalId.coerceAsParsedId(account);
        if (accountRef === null) {
          // TODO: handle this case...
        }

        return Bluebird
          .fromCallback(this.nativeApi.getUserInfo.bind(null, [accountRef.id]))
          .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
            let msg: string = (<Error>error).message || (<fbChatApi.ErrorObject>error).error;
            return Bluebird.reject(new Error(msg));
          })
          .then((results: {[id: string]: fbChatApi.UserInfo}) => {
            let nativeInfo = results[accountRef.id];
            let account: palantiri.Account = {
              driverName: "facebook",
              id: String(this.nativeApi.getCurrentUserID()),
              avatarUrl: nativeInfo.thumbSrc,
              name: nativeInfo.name,
              driverData: nativeInfo
            };
            return account;
          })
      });
  }

  getCurrentUser(): Bluebird<palantiri.UserAccount> {
    return Bluebird.resolve(this.user);
  }

  getContacts(options?: any): Bluebird<palantiri.Account[]> {
    return Bluebird.fromCallback(this.nativeApi.getFriendsList)
      .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
        let msg: string = (<Error>error).message || (<fbChatApi.ErrorObject>error).error;
        return Bluebird.reject(new Error(msg));
      })
      .map((friend: fbChatApi.Friend) => {
        let contactAccount: palantiri.Account;
        contactAccount = {
          driverName: "facebook",
          id: String(friend.userID),
          avatarUrl: friend.profilePicture,
          name: friend.fullName,
          driverData: friend
        };
        return contactAccount;
      });
  }

  contactExists(account: palantiri.Account): Bluebird<boolean> {
    return Bluebird.resolve(true);
  }

  getDiscussions(options?: palantiri.Api.GetDiscussionsOptions): Bluebird<palantiri.Discussion[]> {
    let emptyOptions: palantiri.Api.GetDiscussionsOptions = {
      max: null,
      filter: null
    };
    options = _.assign({}, options, emptyOptions);

    return Bluebird.fromCallback(this.nativeApi.getThreadList.bind(null, 0, options.max))
      .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
        let msg: string = (<Error> error).message || (<fbChatApi.ErrorObject> error).error;
        return Bluebird.reject(new Error(msg));
      })
      .map((thread: fbChatApi.Thread) => {
        let discussion: palantiri.Discussion;

        // TODO: remove it once WebStorm stops to complain...
        //noinspection TypeScriptValidateTypes
        discussion = {
          id: thread.threadID,
          driverName: "facebook",
          creationDate: thread.timestamp,
          name: thread.name,
          description: thread.snippet,
          isPrivate: true,
          participants: [],
          owner: this.user, // TODO: is he really the owner ?
          authorizations: {
            write: thread.readOnly,
            talk: thread.canReply,
            video: true,
            invite: true,
            kick: false,
            ban: false
          },
          driverData: thread
        };

        return discussion;
      })
      .filter((discussion: palantiri.Discussion) => {
        if (!options.filter) {
          return true;
        }
        return options.filter(discussion);
      });
  }

  addMembersToDiscussion(members: palantiri.AccountId[], discussionId: palantiri.DiscussionId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (memberId) => {
        return Bluebird.fromCallback(this.nativeApi.addUserToGroup.bind(null, memberId, discussionId)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  removeMembersFromDiscussion(members: palantiri.AccountId[], discussionId: palantiri.DiscussionId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (memberId) => {
        return Bluebird.fromCallback(this.nativeApi.removeUserFromGroup.bind(null, memberId, discussionId)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  leaveDiscussion(discussion: palantiri.DiscussionId, options?: any): Bluebird<this> {
    console.warn("FacebokApi:leveDiscussion is not implemented");
    return Bluebird.resolve(this);
  }

  sendMessage(message: palantiri.Api.NewMessage, discussionId: palantiri.DiscussionId, options?: any): Bluebird<palantiri.Message> {
    return Bluebird
      .try(() => {
        let fbMessage: fbChatApi.Message = {
          body: message.body
        };
        return Bluebird.fromCallback(this.nativeApi.sendMessage.bind(null, fbMessage, discussionId));
      })
      .then((messageInfo: fbChatApi.MessageInfo) => {
        let result: palantiri.Message;
        result = {
          driverName: "facebook",
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
