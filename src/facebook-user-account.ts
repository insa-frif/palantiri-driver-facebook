/**
 * Created by Ruben on 21/04/2016.
 */
import * as Bluebird from "bluebird";
import {UserAccount} from "palantiri";
import {FacebookConnection} from "./facebook-connection";

export class FacebookUserAccount extends UserAccount {
  getOrCreateConnection(): Bluebird<FacebookConnection> {
    return undefined;
  }

}
