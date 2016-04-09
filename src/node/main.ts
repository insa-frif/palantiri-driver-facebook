import * as login from "facebook-chat-api";

login(
  {email: "FB_EMAIL", password: "FB_PASSWORD"},
  function callback (err, api) {
    if(err){
      return console.error(err.error);
    }

    api.listen(function callback(err, message) {
     api.sendMessage(message.body, message.threadID);
    });
  }
);
