/**
 * Created by Ruben on 11/04/2016.
 */

import * as ochat from '../core/interfaces';

class FacebookProxy implements ochat.Proxy {
	isCompatibleWith(protocol:string):boolean {
		// TODO
		return undefined;
	}

	getContacts(account:ochat.Account):ochat.Contact[] {
		// TODO
		return undefined;
	}

	sendMessage(msg:ochat.Message, discussion:ochat.Discussion, target:ochat.Contact):any {
		// TODO
		return undefined;
	}

}
