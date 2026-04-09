type LogFields = Record<string, string | number | boolean | undefined | null>;

function line(channel: string, event: string, fields?: LogFields) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), channel, event, ...fields }));
}

export function logAuth(event: string, fields?: LogFields) {
  line("auth", event, fields);
}

export function logPayment(event: string, fields?: LogFields) {
  line("payment", event, fields);
}

export function logAi(event: string, fields?: LogFields) {
  line("ai", event, fields);
}
