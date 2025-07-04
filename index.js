import makeWASocket, { DisconnectReason, useMultiFileAuthState, makeInMemoryStore } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { join } from "path";
import fs from "fs";
import handler from "./lib/handler.js";
import setting from "./setting.js";

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const sessionFolder = "./session";

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    syncFullHistory: false,
  });

  store.bind(sock.ev);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (let msg of messages) {
      if (!msg.message || msg.key && msg.key.remoteJid === "status@broadcast") return;
      await handler(sock, msg, setting);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("Bot connected!");
    }
  });
};

startBot();