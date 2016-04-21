/**
 * Created by Ruben on 21/04/2016.
 */
import {EventEmitter} from "events";
import {FacebookConnectedApi} from "./facebook-connected-api";
import {Connection} from "palantiri-interfaces";
import {UserAccount} from "palantiri-interfaces";
import {Message} from "palantiri";
import * as Bluebird from "bluebird";
import * as login from "facebook-chat-api";
import * as readline from "readline";

export class FacebookConnection extends EventEmitter implements Connection {
  connected: boolean;

  connectedApi: FacebookConnectedApi;

  connect(userAccount: UserAccount): Bluebird.Thenable<FacebookConnectedApi> {
    // TODO : when the database will be operational, get this from the database
    let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
    let that = this;
    rl.question("email : ", function (mail: string) {
			rl.question("pass : ", function (passw: string) {
				login(
					{email: mail, password: passw},
					function callback (err, api) {
						if(!err) {
							that.connected = true;
							that.connectedApi = new FacebookConnectedApi();
              that.connectedApi.facebookApi = api;
              api.listen((err, event) => {
                if (err) {
                  console.log("Can't listen...");
                  console.log(err);
                  return null;
                }
                if((event.type === "message")) {
                  let messageEvent: login.MessageEvent = <login.MessageEvent> event;
                  let message: Message = new Message();
                  message.body = messageEvent.body;
                  // TODO : complete message's fields
                  // TODO : import standardEvents from palantiri-interfaces
                  that.emit("messageReceived", message);
                }
              });
              // TODO : handle other basic events and emit other events to inform User
						} else {
							that.connected = false;
              that.connectedApi = null;
						}
					}
				);
			});
		});
    return Bluebird.resolve(this.connectedApi);
  }

  disconnect(): Bluebird.Thenable<FacebookConnection> {
    return undefined;
  }

  getConnectedApi(): Bluebird.Thenable<FacebookConnectedApi> {
    return undefined;
  }

}
