import fs from "fs";
import path from "path";

const pluginDir = path.resolve("./plugins");
let plugins = [];

// Muat semua plugin dari folder plugins
fs.readdirSync(pluginDir).forEach((file) => {
  if (file.endsWith(".js")) {
    import(`../plugins/${file}`).then((plugin) => {
      plugins.push(plugin.default);
    });
  }
});

export default async function handler(sock, msg, setting) {
  try {
    const prefix = setting.prefix.find((p) => msg.message?.conversation?.startsWith?.(p));
    if (!prefix) return;

    const body = msg.message.conversation;
    const args = body.trim().split(" ");
    const command = args.shift().slice(prefix.length).toLowerCase();

    for (let plugin of plugins) {
      if (plugin?.command?.includes(command)) {
        await plugin.execute(sock, msg, args, setting);
        break;
      }
    }
  } catch (err) {
    console.error("Handler error:", err);
  }
}