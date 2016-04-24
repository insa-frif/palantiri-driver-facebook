import {Connection as ConnectionInterface} from "palantiri-interfaces";
import {FacebookConnection, FacebookConnectionOptions} from "./facebook-connection";
import {FacebookApi} from "./facebook-api";

export type Api = FacebookApi;
export let Api = FacebookApi;
export type ConnectionOptions = FacebookConnectionOptions;
export type Connection = FacebookConnection;
export let Connection: ConnectionInterface.Constructor<ConnectionOptions, FacebookConnection> = FacebookConnection;
export default Connection;
