/**
 * Created by Ruben on 09/04/2016.
 */

declare module "facebook-chat-api" {
	interface FacebookChatApi {
    addUserToGroup(userID: number, threadID: number, callback?: (err: Error) => any): void;
		changeArchivedStatus(threadOrThreadsID: number | number[], archive: boolean, callback?: (err: Error) => any): void;
		changeGroupImage(image: any, threadID: number, callback?: (err: Error) => any): void;
			// TODO : image is "file stream or image"
		changeThreadColor(color: string, threadID: number, callback?: (err: Error) => any): any;
		changeThreadEmoji(emoji: string, threadID: number,  callback?: (err: Error) => any): any;
		changeNickname(nickname: string, threadID: number, participantID: number, callback?: (err: Error) => any): any;
		deleteMessage(messageOrMessagesID: number | number[], callback?: (err: Error) => any): any;
		getAppState(): AppStateContainer;
		getCurrentUserID(): number;
		getFriendsList(callback: (err: Error, arr: FacebookFriend[]) => any): void;
		getOnlineUsers(callback: (err: Error, arr: FacebookUser) => any): void;
		getThreadHistory(threadID: number, start: number, end: number, timestamp: any, callback: (err: Error, history: FacebookMessage[]) => any): any;
		getThreadInfo(threadID: number, callback: (err: Error, info: FacebookThreadInfo) => any): any;
		getThreadList(start: number, end: number, callback: (err: Error, obj: FacebookThread[]) => any): void;
		deleteThread(threadOrThreads: number | number[], callback?: (err: Error) => any): void;
		getUserID(name: string, callback: (err: Error, arr: number[]) => any): void;
		getUserInfo(ids: number | number[], callback: (err: Error, arr: Map<number, FaceboolUserInfo>) => any): void;
		listen(callback: (err: Error, eventType: FacebookMessage) => any): void;
		logout(callback?: (err: Error) => any): void;
		markAsRead(threadID: number, callback?: (err?: Error) => any): void;
		removeUserFromGroup(userID: number, threadID: number, callback?: (err?: Error) => any): void;
		searchForThread(name: string | number | string[] | number[], callback: (err: Error, obj: FacebookThread) => any): void;
		sendMessage(message: FacebookMessage | string, threadID: number, callback?: (err: Error, messageInfo: FacebookMessageInfo) => any): void;
		sendTypingIndicator(threadID: number, callback?: (err: Error) => any): any;
		setOptions(options: FacebookApiOptions): void;
		setTitle(newTitle: string, threadID: number, callback?: (err: Error, obj: FacebookConfirmation) => any): void;

		// TODO : ID numbers only ?
	}

	interface FacebookMessage {
		// common
		type: string;
		threadID: number;
		// message
		senderID: number;
		body: string;
		messageID: number;
		isGroup: boolean;
		attachments?: FacebookAttachment[];
		sticker?: number; // ID
		url?: string;
		// event
		logMessageType: string;
		logMessageData: any | any[];
		logMessageBody: string;
		author: string | number;
		// typ
		isTyping: boolean;
		from: number; // ID of the user who started typing
		fromMobile: boolean;
		// read
		time: any;  // TODO : date ? timestamp ?
		// read_receipt
		reader: number;
		// presence
		timestamp: number;
		userID: number;
		statuses: FacebookStatus;
	}

	interface FacebookStatus {
		fbAppStatus: FacebookUserStatus;
		messengerStatus: FacebookUserStatus;
		otherStatus: FacebookUserStatus;
		status: FacebookUserStatus;
		webStatus: FacebookUserStatus;
	}

	/* INTERFACES for attachement */
	interface FacebookAttachment {
		type: string;
	}

	// Case type == "sticker"
	interface FacebookSticker extends FacebookAttachment {
		url: string;
		stickerID: number;
		packID: number;
		frameCount: number;
		frameRate: number;
		framesPerRow: number;
		framesPerCol: number;
		spriteURI: any; // TODO : ?
		spriteURI2x: any; // TODO : ?
		height: number;
		width: number;
		caption: string;
		description: string;
	}

	// Case type == "file"
	interface FacebookFile extends FacebookAttachment {
		name: string;
		url: string;
		ID: number;
		fileSize: number;
		isMalicious: boolean;
		mimeType: any;  // TODO : ?
	}

	// Case type == "photo"
	interface FacebookPhoto extends FacebookAttachment {
		name: string;
		hiresUrl: string[];
		thumbnailUrl: string;
		previewUrl: string;
		previewWidth: number;
		previewHeight: number;
		facebookUrl: string;
		ID: number;
		filename: string;
		mimeType: any;  // TODO : ?
		url: string;
		width: number;
		height: number;
	}

	// Case type == "animated_image"
	interface FacebookAnimatedImage extends FacebookAttachment {
		name: string;
		facebookUrl: string;
		previewUrl: string;
		previewWidth: number;
		previewHeight: number;
		thumbnailUrl: string;
		ID: number;
		filename: string;
		mimeType: any;  //TODO : ?
		width: number;
		height: number;
		url: string;
		rawGifImage: any; //TODO : ?
		rawWebpImage: any;  //TODO : ?
		animatedGifUrl: string;
		animatedGifPreviewUrl: string;
		animatedWebpUrl: string;
		animatedWebpPreviewUrl: string;
	}

	// Case type == "share"
	interface FacebookShare extends FacebookAttachment {
		description: string;
		ID: number;
		subattachments: FacebookAttachment; // TODO : ?
		animatedImageSize: number;
		width: number;
		height: number;
		image: any; // TODO : voir plus haut pour les images
		playable: boolean;
		duration: number;
		source: string;
		title: string;
		facebookUrl: string;
		url: string;
	}
	/* */

	interface FacebookConfirmation {
		threadID: number;
	}

	interface FacebookApiOptions {
		logLevel: FacebookLogLevel;
		selfListen: boolean;
		listenEvents: boolean;
		pageID: number;
		updatePresence: boolean;
		forceLogin: boolean;
	}

	enum FacebookLogLevel {
		'silly',
		'verbose',
		'info',
		'http',
		'warn',
		'error',
		'silent'
	}

	interface FacebookMessageInfo {
		threadID: number;
		messageID: number;
		timestamp : any;  // TODO : timestamp ?
	}

	interface FaceboolUserInfo {
		name: string;
		firstName: string;
		vanity: any;  // TODO : ?
		thumbSrc: any;  // TODO : ?
		profileUrl: string;
		gender: string;
		type: any;  // TODO : ?
		isFriend: boolean;
		isBirthday: boolean;
		searchTokens: any[] | any;  // TODO : ?
		alternateName: string;
	}

	interface FacebookThread {
		threadID: number;
		participantIDs: number[];
		formerParticipants: number[] | string []; // TODO : ID or ?
		name : string;
		snippet: any; // TODO : ?
		snippetHasAttachment: boolean;
		snippetAttachments: any[]; // TODO : ?
		snippetSender: any; // TODO : ?
		unreadCount: number;
		messageCount: number;
		imageSrc: string;
		timestamp: any;
		serverTimestamp: any;
		muteSettings: any[];
		isCanonicalUser: boolean;
		isCanonical: boolean;
		canonicalFbid: number;
		isSubscribed: boolean;
		rootMessageThreadingID: number;
		folder: any;  // TODO : ?
		isArchived: boolean;
		recipientsLoadable: any;
		hasEmailParticipant: boolean;
		readOnly: boolean;
		canReply: boolean;
		composerEnabled: boolean;
		blockedParticipants: any[]; // TODO : ?
		lastMessageID: number;
	}

	interface FacebookThreadInfo {
		participantIDs: number[];
		name: string;
		snippet: any; // TODO : ?
		messageCount: number;
		emoji: string;
		nicknames: string[];
		color: string;
	}

	interface FacebookUser {
		lastActive: any;  // TODO : date ?
		userID: number;
		status: FacebookUserStatus;
	}

	enum FacebookUserStatus {
		'offline',
		'idle',
		'active',
		'mobile'
	}

	interface FacebookFriend {
		alternateName: string;
		firstName: string;
		gender: string;
		userID: number;
		isFriend: boolean;
		fullName: string;
		profilePicture: any;
		type: any;  // TODO : ?
		profileUrl: string;
		vanity: any; // TODO : ?
		isBirthday: boolean;
		// TODO : vérifier les champs
	}

  interface Credentials {
    email: string;
    password: string;
  }

  interface AppStateContainer {
    appState: any;
  }

  interface LoginError {
    error: string;
  }

  interface staticFacebookChatApi { // login
    (credentials: Credentials | AppStateContainer, callback?: (err: LoginError, api: FacebookChatApi) => any): void;
    (credentials: Credentials | AppStateContainer, options: FacebookApiOptions, callback?: (err: LoginError, api: FacebookChatApi) => any): void;
  }

  let facebookChatApi: staticFacebookChatApi;
  export = facebookChatApi;
}
