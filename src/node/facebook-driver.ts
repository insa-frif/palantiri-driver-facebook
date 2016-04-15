/**
 * Created by Ruben on 11/04/2016.
 */

import * as ochat from '../core/interfaces';
import * as login from "facebook-chat-api";

class FacebookProxy implements ochat.Proxy {

	isCompatibleWith(protocol: string): boolean {
		return protocol === "facebook";
	}

	getContacts(account: ochat.Account): ochat.Contact[] {
		// TODO
		return undefined;
	}

	sendMessage(msg:ochat.Message, discussion: ochat.Discussion, target: ochat.Contact): any {
		// TODO
		return undefined;
	}

}
