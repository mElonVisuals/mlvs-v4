import { baseEmbed } from '../../utils/embed.js';

export const name = '8ball';
export const description = 'Ask the magic 8ball a question.';
export const usage = '8ball <question>';

const answers = [
  'It is certain.', 'Without a doubt.', 'You may rely on it.', 'Yes definitely.', 'It is decidedly so.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
];

export async function execute(message, args) {
  const question = args.join(' ');
  if (!question) return message.reply('Ask a question: `!8ball <your question>`');
  const embed = baseEmbed(message, { banner: false })
    .setTitle('Magic 8-Ball')
  .setDescription(['Usage:\n• 8ball <question>', '—'].join('\n'))
  .addFields(
      { name: 'Question', value: question },
      { name: 'Answer', value: answers[Math.floor(Math.random()*answers.length)] }
    );
  await message.channel.send({ embeds: [embed] });
}
