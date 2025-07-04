export default {
    command: ["ping", "test"],
    async execute(sock, msg, args, setting) {
      const from = msg.key.remoteJid;
      await sock.sendMessage(from, { text: "Bot aktif! ✅" });
    },
  };  