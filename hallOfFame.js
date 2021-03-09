module.exports = {
	execute(reaction, user, db) {
		const { outputChannelID, reactionThreshold } = require('./config.json');
		console.log(`Reaction: ${reaction.emoji.name} on ${reaction.message}`);
		const url = this.getURLFromMsg(reaction.message);
		const selectPost = `SELECT *
							FROM posts
							WHERE url = ?`;

		db.get(selectPost, [url], (err, row) => {
			if(err) return console.error(err);

			if(!row) {
				insertPost()
					.then(insertReaction(user.id, user.tag, reaction.emoji.name))
					.then(updatePostRecord(0, 1, null));
			}
			else {
				checkRepostConditions(row);
			}
		});

		function insertPost() {
			return new Promise(resolve => {
				const values = [url, 0, 0, reaction.message.author.id, reaction.message.author.tag];
				const insertSQL = `INSERT INTO posts (
										url, 
										flag, 
										count, 
										userid, 
										usertag
									) VALUES (?, ?, ?, ?, ?)`;

				db.run(insertSQL, values, err => {
					if(err) return console.error(err);

					resolve(`A row has been inserted into posts with rowid ${this.lastID}`);
				});
			});
		}

		function insertReaction(id, tag, emoji) {
			return new Promise(resolve => {
				const values = [url, id, tag, emoji];

				db.run('INSERT INTO reactions VALUES (?, ?, ?, ?)', values, err => {
					if(err) return console.error(err);

					resolve(`A row has been inserted into reactions with rowid ${this.lastID}`);
				});
			});
		}

		function updatePostRecord(flag, inc, postid) {
			return new Promise(resolve => {
				const updatePost = `UPDATE posts
									SET flag = ?,
										count = ?,
										repostid = ?
									WHERE url = ?`;

				db.get(selectPost, [url], (err, row) => {
					if(err) return console.error(err);

					const id = postid ? postid : row.repostid;
					db.run(updatePost, [flag, row.count + inc, id, url], err => {
						if(err) return console.error(err);
						resolve('A row has been updated with ' + this.changes);
					});
				});
			});
		}

		async function checkRepostConditions(postRow) {
			const flag = postRow.flag;

			if(!flag) {
				await insertReaction(user.id, user.tag, reaction.emoji.name);
				updatePostRecord(0, 1, null);
				checkReactionThreshold(postRow);
			}
			else {
				updatePostRecord(1, 1, null).then(updateEmoji);
			}
		}

		async function checkReactionThreshold(postRow) {
			const reactorCount = await getReactorCount().catch(console.error);

			if(reactorCount >= reactionThreshold) {
				repost(postRow);
			}
		}

		function getReactorCount() {
			return new Promise (resolve => {
				const selectRows = `SELECT DISTINCT userid
									FROM reactions
									WHERE url = ?`;

				db.all(selectRows, [url], (err, rows) => {
					if(err) return console.error(err);
					resolve(rows.length);
				});
			});
		}

		function updateEmoji() {
			db.get('SELECT count, repostid FROM posts WHERE url = ?', [url], async (err, row) => {
				if(err) return console.error(err);

				let post;
				try {
					await reaction.client.channels.fetch(outputChannelID)
						.then(channel => channel.messages.fetch(row.repostid))
						.then(msg => {
							post = msg;
							msg.reactions.removeAll();
						});
				}
				catch(err) {
					console.error(err);
				}

				const digits = [];
				let reactionCount = row.count;

				while(reactionCount > 0) {
					digits.push(Math.floor(reactionCount % 10));
					reactionCount = Math.floor(reactionCount / 10);
				}

				// await keyword ensures that the reactions are set in order
				for(let i = digits.length - 1; i >= 0; i--) {
					const emoji = getDigitEmoji(digits[i]);
					try {
						await post.react(emoji);
					}
					catch(err) {
						console.error(err);
					}
				}
			});
		}

		function getDigitEmoji(num) {
			switch(num) {
			case 0:
				return '0️⃣';
			case 1:
				return '1️⃣';
			case 2:
				return '2️⃣';
			case 3:
				return '3️⃣';
			case 4:
				return '4️⃣';
			case 5:
				return '5️⃣';
			case 6:
				return '6️⃣';
			case 7:
				return '7️⃣';
			case 8:
				return '8️⃣';
			case 9:
				return '9️⃣';
			}
		}

		async function repost(postRow) {
			const entryNumber = await updatePostRecord(1, 0, null).then(countHofEntries);
			const userTag = await reaction.client.users.fetch(postRow.userid).catch(console.error);
			const showMsgContent = reaction.message.content ? `\`\`\`${reaction.message.content}\`\`\`` : '';
			const repostMsg =
			`Hall of Fame Entry #${entryNumber}: \nArtist: ${userTag} \nArtwork: ${url} ${showMsgContent}`;

			reaction.client.channels.fetch(outputChannelID)
				.then(channel => channel.send(repostMsg))
				.then(msg => updatePostRecord(1, 0, msg.id))
				.catch(console.error);
		}

		function countHofEntries() {
			return new Promise((resolve, reject) => {
				db.get('SELECT COUNT(*) AS count FROM posts WHERE flag = 1', [], (err, row) => {
					if(err) return console.error(err);
					if(row.count) resolve(row.count);
					else reject('row.count is undefined');
				});
			});
		}
	},

	getURLFromMsg(msg) {
		return msg.attachments.size ? msg.attachments.first().url : msg.embeds[0].url;
	},
};