/**
 * Created by Ruben on 09/04/2016.
 */

declare module "facebook-chat-api" {
	interface FacebookChatApi {
    addUserToGroup(userID: number, threadID: number, callback?: (err: Error) => any): void;
	}

  interface Credentials {
    email: string;
    password: string;
  }

  interface AppStateContainer {
    appState: any;
  }

  interface LoginOptions {
    // TODO
  }

  interface LoginError {
    error: string;
  }

  interface staticFacebookChatApi { // login
    (credentials: Credentials | AppStateContainer, callback?: (err: LoginError, api: FacebookChatApi) => any): void;
    (credentials: Credentials | AppStateContainer, options: LoginOptions, callback?: (err: LoginError, api: FacebookChatApi) => any): void;
  }

  let facebookChatApi: staticFacebookChatApi;
  export = facebookChatApi;
}
