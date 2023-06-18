export class TestBot {
  constructor(bot) {
    bot.onText(/\/ping/, (msg, match) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{ text: 'ok 1' }]],
        }),
      };
      bot.sendMessage(chatId, 'pong', opts);
    });
  }
}
