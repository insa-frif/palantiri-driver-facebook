import * as readline from "readline";
import * as Bluebird from "bluebird";

export function getOptions(): Bluebird<any> {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let credentials: any = {};

  return Bluebird.fromCallback(rl.question.bind(rl, "Email: "))
    .then((email: string) => {
      credentials.email = email;
      return Bluebird.fromCallback(rl.question.bind(rl, "Password: "));
    })
    .then((password: string) => {
      credentials.password = password;
      return {credentials: credentials};
    });
}
