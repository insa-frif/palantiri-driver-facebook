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

enum ConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED
}

export class FacebookConnection extends EventEmitter implements Connection {
  options: FacebookConnectionOptions = null;
  api: FacebookApi = null;

  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  constructor (options?: FacebookConnectionOptions) {
    super();
    this.options = options;
  }

  getInfo(): any {
    return {driver: "facebook"};
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  getApi(): FacebookApi {
    if (!this.isConnected()) {
      throw new Error("Not connected");
    }
    if (this.api === null) {
      throw new Error("Api is not ready");
    }
    return this.api;
  }

  connect(): Bluebird<FacebookApi> {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      this.connectionState = ConnectionState.CONNECTING;
    } else {
      return Bluebird.try(() => this.getApi());
    }
    return Bluebird.fromCallback(fbChatApi.bind(null, this.options.credentials))
      .then((nativeApi: fbChatApi.Api) => {
        let id = nativeApi.getCurrentUserID();
        return Bluebird.fromCallback(nativeApi.getUserInfo.bind(null, [id]))
          .then((results: fbChatApi.GetUserInfoResult[]) => {
            this.connectionState = ConnectionState.CONNECTED;
            this.api = new FacebookApi(nativeApi, results[id], this);
            this.emit(Connection.events.CONNECTED, this);
            return this.api;
          });
      });
  }

  disconnect(): Bluebird<this> {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return Bluebird.resolve(this);
    }

    return Bluebird.fromCallback((cb) => {
      this.api.nativeApi.logout((err: Error) => {
        if (err) {
          return cb (new Error("Cannot logout"));
        }
        this.emit(Connection.events.DISCONNECTED, this);
        cb(null, this);
      });
    });
  }
}
