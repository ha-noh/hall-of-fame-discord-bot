module.exports = {
	execute(reaction, user, db) {
		const { outputChannelID, reactionThreshold } = require('./config.json');
		console.log(`Reaction: ${reaction.emoji.name} on ${reaction.message}`);
		const url = this.getURLFromMsg(reaction.message);
		const selectPost = `SELECT *
							FROM posts
							WHERE url = ?`;

		db.get(selectPost, [url], (err, row) => {
			if(err) return console.error(err.message);

			if(!row) {
				insertPost()
					.then(() => insertReaction(user.id, user.tag, reaction.emoji.name))
					.then(inc => updatePostRecord(0, inc, null))
					.catch(console.error);
			}
			else {
				insertReaction(user.id, user.tag, reaction.emoji.name)
					.then(inc => checkRepostConditions(row, inc))
					.catch(console.error);
			}
		});

		function insertPost() {
			return new Promise(resolve => {
				const values = [url, 0, 0, reaction.message.author.id, reaction.message.author.tag];
				const insertSQL = `INSERT INTO posts (
										url, 
										repost, 
										count, 
										userid, 
										usertag
									) VALUES (?, ?, ?, ?, ?)`;

				db.run(insertSQL, values, err => {
					if(err) return console.error(err.message);

					resolve(`A row has been inserted into posts with rowid ${this.lastID}`);
				});
			});
		}

		function insertReaction(id, tag, emoji) {
			return new Promise((resolve) => {
				const values = [url, id, tag, emoji];

				db.run('INSERT INTO reactions VALUES (?, ?, ?, ?)', values, err => {
					if(err) {
						console.error(err.message);
						resolve(0);
					}

					resolve(1);
				});
			});
		}

		function updatePostRecord(flag, inc, postid) {
			return new Promise(resolve => {
				const updatePost = `UPDATE posts
									SET repost = ?,
										count = ?,
										repostid = ?
									WHERE url = ?`;

				db.get(selectPost, [url], (err, row) => {
					if(err) return console.error(err.message);

					const id = postid ? postid : row.repostid;

					db.run(updatePost, [flag, row.count + inc, id, url], err => {
						if(err) return console.error(err.message);
						resolve('A row has been updated with ' + this.changes);
					});
				});
			});
		}

		async function checkRepostConditions(row, inc) {
			const repostFlag = row.repost;
			const blacklistFlag = row.blacklist;

			if(!repostFlag) {
				updatePostRecord(0, inc, null)
					.then(() => {
						if(!blacklistFlag) {
							checkReactionThreshold(row);
						}
						else {
							console.log(`${url} is blacklisted so a repost was prevented`);
						}
					});
			}
			else {
				updatePostRecord(1, inc, null)
					.then(updateEmoji);
			}
		}

		function checkReactionThreshold(row) {
			getReactorCount()
				.then(reactorCount => {
					if(reactorCount >= reactionThreshold) {
						repost(row);
					}
				})
				.catch(console.error);
		}

		function getReactorCount() {
			return new Promise (resolve => {
				const selectRows = `SELECT DISTINCT userid
									FROM reactions
									WHERE url = ?`;

				db.all(selectRows, [url], (err, rows) => {
					if(err) return console.error(err.message);
					resolve(rows.length);
				});
			});
		}

		async function repost(row) {
			try {
				const entryNumber = await updatePostRecord(1, 0, null)
					.then(countHofEntries)
					.catch(console.error);
				const artist = await reaction.client.users.fetch(row.userid)
					.catch(console.error);
				const showMsgContent = reaction.message.content ? `\`\`\`${reaction.message.content}\`\`\`` : '';
				const repostMsg = `Hall of Fame Entry #${entryNumber}: \nArtist: ${artist} \nArtwork: ${url} ${showMsgContent}`;

				reaction.client.channels.fetch(outputChannelID)
					.then(channel => channel.send(repostMsg))
					.then(msg => {
						console.log('reposted ' + url);
						updatePostRecord(1, 0, msg.id);
					})
					.then(updateEmoji)
					.catch(console.error);
			}
			catch(err) {
				console.error(err.message);
			}
		}

		function countHofEntries() {
			return new Promise((resolve) => {
				db.get('SELECT COUNT(*) AS count FROM posts WHERE repost = 1', [], (err, row) => {
					if(err) return console.error(err.message);
					if(row.count) resolve(row.count);
				});
			});
		}

		function updateEmoji() {
			db.get('SELECT count, repostid FROM posts WHERE url = ?', [url], (err, row) => {
				if(err) return console.error(err.message);

				const digits = [];
				let reactionCount = row.count;

				while(reactionCount > 0) {
					digits.push(Math.floor(reactionCount % 10));
					reactionCount = Math.floor(reactionCount / 10);
				}

				reaction.client.channels.fetch(outputChannelID)
					.then(channel => channel.messages.fetch(row.repostid))
					.then(msg => {
						const post = !msg.reactions ? msg.first() : msg;
						post.reactions.removeAll();
						return post;
					})
					.then(post => updateNumberReactions(digits, post))
					.catch(console.error);
			});
		}

		async function updateNumberReactions(digits, post) {
			try {
				for(let i = digits.length - 1; i >= 0; i--) {
					const emoji = getDigitEmoji(digits[i]);
					// await keyword ensures that the reactions are set in order
					await post.react(emoji);
				}
			}
			catch(err) {
				console.error(err.message);
			}
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
	},

	getURLFromMsg(msg) {
		return msg.attachments.size ? msg.attachments.first().url : msg.embeds[0].url;
	},
};