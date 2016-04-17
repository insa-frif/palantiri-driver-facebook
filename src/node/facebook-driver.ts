/**
 * Created by Ruben on 11/04/2016.
 */

import {Client} from "../core/interfaces";
import {Proxy} from "../core/interfaces";
import {User} from "../core/interfaces";
import {Contact} from "../core/interfaces";
import {Discussion} from "../core/interfaces";
import {UserAccount} from "../core/interfaces";
import {ContactAccount} from "../core/interfaces";
import {Message} from "../core/interfaces";
import {MSG_FLAG_EDI} from "../core/interfaces"
import {Connection} from "../core/interfaces";
import {OChatEmitter} from "../core/interfaces";
import {Listener} from "../core/interfaces";
import * as login from "facebook-chat-api";

class FacebookProxy implements Proxy {
	protocol: string;

	connection: Connection;

	isCompatibleWith(protocol: string): boolean {
		return undefined;
	}

	getOrCreateConnection(account: UserAccount): Promise<Connection> {
		return undefined;
	}

	getContacts(account: UserAccount): Promise<Contact[]> {
		return undefined;
	}

	getDiscussions(account: UserAccount, max?: number, filter?: (discuss: Discussion) => boolean): Promise<Discussion[]> {
		return undefined;
	}

	sendMessage(msg: Message, recipient: ContactAccount, callback?: (err: Error, succesM: Message) => any): void {
	}
}
