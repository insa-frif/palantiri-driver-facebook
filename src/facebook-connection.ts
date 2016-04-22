import * as fbChatApi from "facebook-chat-api";
import * as Bluebird from "bluebird";
import {EventEmitter} from "events";
import {Connection} from "palantiri-interfaces";

import {FacebookApi} from "./facebook-api";

export interface FacebookConnectionOptions {
  credentials: {
    email: string;
    password: string;
  };
}

export class FacebookConnection extends EventEmitter implements Connection {
  options: FacebookConnectionOptions = null;
  connected: boolean = false;
  api: FacebookApi = null;

  constructor (options?: FacebookConnectionOptions) {
    super();
    this.options = options;
  }

  getInfo(): any {
    return null;
  }

  isConnected(): boolean {
    return false;
  }

  getApi(): FacebookApi {
    return null;
  }

  connect(): Bluebird<FacebookApi> {
    return null;
  }

  disconnect(): Bluebird<this> {
    return null;
  }

  // connect(): Bluebird<FacebookApi> {
  //   // TODO : when the database will be operational, get this from the database
  //   let rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  //   });
  //   let that = this;
  //   rl.question("email : ", function (mail: string) {
  //     rl.question("pass : ", function (passw: string) {
  //     	fbChatApi(
  //     		{email: mail, password: passw},
  //     		function callback (err, api) {
  //     			if(!err) {
  //     				that.connected = true;
  //     				that.connectedApi = new FacebookApi();
  //             that.connectedApi.facebookApi = api;
  //             api.listen((err, event) => {
  //               if (err) {
  //                 console.log("Can't listen...");
  //                 console.log(err);
  //                 return null;
  //               }
  //               if((event.type === "message")) {
  //                 let messageEvent: fbChatApi.MessageEvent = <fbChatApi.MessageEvent> event;
  //                 let message: Message = new Message();
  //                 message.body = messageEvent.body;
  //                 // TODO : complete message's fields
  //                 // TODO : import standardEvents from palantiri-interfaces
  //                 that.emit("messageReceived", message);
  //               }
  //             });
  //             // TODO : handle other basic events and emit other events to inform User
  //     			} else {
  //     				that.connected = false;
  //             that.connectedApi = null;
  //     			}
  //     		}
  //     	);
  //     });
  //   });
  //   return Bluebird.resolve(this.connectedApi);
  // }


  // disconnect(): Bluebird.Thenable<FacebookConnection> {
  //   if(this.connected) {
  //     let that = this;
  //     this.connectedApi.facebookApi.logout((err) => {
  //       if(err) {
  //         console.log("Can't disconect...");
  //       }
  //       that.connected = false;
  //     });
  //   }
  //   return Bluebird.resolve(this);
  // }
  //
  // getConnectedApi(): Bluebird.Thenable<FacebookApi> {
  //   if (!this.connected) {
  //     return Bluebird.resolve()
  //   }
  //   return Bluebird.resolve(this.connectedApi);
  // }

}
