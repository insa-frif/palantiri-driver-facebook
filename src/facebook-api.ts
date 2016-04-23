import * as fbChatApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import * as _ from "lodash";
import {EventEmitter} from "events";

import {Api, UserAccount, Account, DiscussionId, AccountId, Discussion} from "palantiri-interfaces";
import {FacebookConnection} from "./facebook-connection";

export class FacebookApi extends EventEmitter implements Api {
  nativeApi: fbChatApi.Api = null;
  connection: FacebookConnection = null;
  user: UserAccount = null;

  constructor (nativeApi: fbChatApi.Api, nativeCurrentUser: fbChatApi.GetUserInfoResult, connection: FacebookConnection) {
    super();
    this.nativeApi = nativeApi;
    this.connection = connection;

    this.user = {
      id: String(this.nativeApi.getCurrentUserID()),
      driver: "facebook",
      name: nativeCurrentUser.name,
      driverData: nativeCurrentUser,
      getOrCreateConnection: null,
      sendMessage: null
    };

    this.nativeApi.listen((err, ev) => {
      this.handleNativeEvent(ev);
    })
  }

  handleNativeEvent (nativeEvent: fbChatApi.BaseFacebookEvent) {
    switch (nativeEvent.type) {
      case "message": return this.handleMessageEvent(<fbChatApi.MessageEvent> nativeEvent);
      default:
        console.log(nativeEvent);
    }
  }

  handleMessageEvent (nativeEvent: fbChatApi.MessageEvent) {
    let event: Api.events.MessageEvent;

    // TODO: remove it once WebStorm stops to complain...
    //noinspection TypeScriptValidateTypes
    event = {
      type: Api.events.MESSAGE,
      message: {
        id: String(nativeEvent.messageID),
        driver: "facebook",
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
    this.emit(Api.events.MESSAGE, event);
  }

  getCurrentUser(): Bluebird<UserAccount> {
    return Bluebird.resolve(this.user);
  }

  getContacts(options?: any): Bluebird<Account[]> {
    return Bluebird.fromCallback(this.nativeApi.getFriendsList)
      .catch((error: Error | fbChatApi.ErrorObject) => { // normalize the error handling from facebook-chat-api
        let msg: string = (<Error>error).message || (<fbChatApi.ErrorObject>error).error;
        return Bluebird.reject(new Error(msg));
      })
      .map((friend: fbChatApi.Friend) => {
        let contactAccount: Account;
        contactAccount = {
          id: String(friend.userID),
          driver: "facebook",
          name: friend.fullName,
          driverData: friend
        };
        return contactAccount;
      });
  }

  contactExists(account: Account): Bluebird<boolean> {
    return Bluebird.resolve(true);
  }

  getDiscussions(options?: Api.GetDiscussionsOptions): Bluebird<Discussion[]> {
    let emptyOptions: Api.GetDiscussionsOptions = {
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
        let discussion:Discussion;

        // TODO: remove it once WebStorm stops to complain...
        //noinspection TypeScriptValidateTypes
        discussion = {
          id: thread.threadID,
          driver: "facebook",
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
      .filter((discussion: Discussion) => {
        if (!options.filter) {
          return true;
        }
        return options.filter(discussion);
      });
  }

  addMembersToDiscussion(members: AccountId[], discussionId: DiscussionId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (memberId) => {
        return Bluebird.fromCallback(this.nativeApi.addUserToGroup.bind(null, memberId, discussionId)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  removeMembersFromDiscussion(members: AccountId[], discussionId: DiscussionId, options?: any): Bluebird<this> {
    return Bluebird
      .each(members, (memberId) => {
        return Bluebird.fromCallback(this.nativeApi.removeUserFromGroup.bind(null, memberId, discussionId)); // TODO: normalize errors
      })
      .thenReturn(this);
  }

  leaveDiscussion(discussion: DiscussionId, options?: any): Bluebird<this> {
    console.warn("FacebokApi:leveDiscussion is not implemented");
    return Bluebird.resolve(this);
  }

  sendMessage(message: Api.NewMessage, discussionId: DiscussionId, options?: any): Bluebird<this> {
    return Bluebird
      .try(() => {
        let fbMessage: fbChatApi.Message = {
          body: message.body
        };
        return Bluebird.fromCallback(this.nativeApi.sendMessage.bind(null, fbMessage, discussionId));
      })
      .thenReturn(this);
  }
}
