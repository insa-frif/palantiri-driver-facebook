/**
 * Created by Ruben on 21/04/2016.
 */
import {EventEmitter} from "events";
import {FacebookConnectedApi} from "./facebook-connected-api";
import {Connection} from "palantiri-interfaces";
import {UserAccount} from "palantiri-interfaces";
import * as Bluebird from "bluebird";

export class FacebookConnection extends EventEmitter implements Connection {
  connected: boolean;

  connectedApi: FacebookConnectedApi;

  connect(userAccount: UserAccount):Bluebird.Thenable<FacebookConnectedApi> {
    return undefined;
  }

  disconnect(): Bluebird.Thenable<FacebookConnection> {
    return undefined;
  }

  getConnectedApi(): Bluebird.Thenable<FacebookConnectedApi> {
    return undefined;
  }

}
