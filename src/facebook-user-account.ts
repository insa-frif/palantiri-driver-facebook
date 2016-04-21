/**
 * Created by Ruben on 21/04/2016.
 */
import * as Bluebird from "bluebird";
import {UserAccount} from "palantiri";
import {FacebookConnection} from "./facebook-connection";

export class FacebookUserAccount extends UserAccount {
  getOrCreateConnection(): Bluebird<FacebookConnection> {
    if(this.connection) {
      if(this.connection.connected) {
        return Bluebird.resolve(this.connection);
      }
    } else {
      this.connection = new FacebookConnection();
    }
    this.connection.connect(this);
    return Bluebird.resolve(this.connection);
    // TODO : heu, mon retour est bon ?
  }
}