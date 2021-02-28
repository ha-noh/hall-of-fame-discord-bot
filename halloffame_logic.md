# Goal: Have the bot repost posts from an input channel to an output channel if enough unique users react to it - it is essentially an automated hall of fame.

# Data storage:
1. There are two tables in the DB; the Collection uses the attachment/embed Url as a primary key, while the List uses it as a foreign key
	1. The "Post Collection", or "Collection" table has three columns
		- its Url (primary key)
		- a boolean Flag to track whether it's been reposted to the Output channel
		- a Count of the total number of reactions
		- user id of Post's author
		- user tag of Post's author
		- the repost's id
	2. The "Reactions List", or "List" table has five columns
		- Url (foreign key)
		- user id of Reactor
		- user tag of Reactor
		- reaction emoji used
		- Primary key is (url, userid, emoji)

# On reaction to a Post in the Input channel:
1. Check if the reaction
	- occurred in the correct channel,
	- is on an image/video post (maybe allow text if it's in a quote?)

2. Check the Collection for the Post (via its Url)
	1. if there is no entry, add one and set its Flag to false, its Count to 1, and add the reactor to the "List"
	2. else check if the Reactor appears in the List
		1. Count++
		2. if !Flag, add the Reactor to the List
			- if the (number of unique reactors in the List) >= the Threshold, repost and set Flag to true
		3. else if Flag is true, update the emoji reactions on the Output post

3. Repost to the Output Channel
	1. Tag the original poster and include the original message content in a quote
	2. Store the Repost's id to the Collection
	3. React to the Repost with number emojis that spell out the Count

# On Post to Input Channel:
1. Check if its Url appears in the Collection
	- if true, delete Post and post the error message "Sorry, this image/video has been posted already; your submission has been deleted"

# Corner Cases/Issues:
1. ~~As previously mentioned, because the Post's embedded url is used as its key, duplicate urls within the Input channel can cause issues.~~
2. ~~Any reactions removed from a Post will not be included in the Count if the bot reboots - the Count will be built only from the reactions on the Post at the bot's startup.~~
3. The reaction listener needs to wait for the Collection to be constructed before executing
4. What happens when a post is deleted from the Output channel? As of now this would prevent any future reactions on the Input post from having any effect.
5. ~~A db would be a better way to store the Collection and List contents; more performant and persistent - fetching messages to build the Collection is limited because only a maximum of 50 messages can be fetched.~~
6. Due to its interior logic, a Threshold of 1 won't always trigger a repost off its first reaction. To be more specific: the first reaction on a Post not recorded in the DB will never check the Repost conditions; subsequent reactions, even from the same Reactor, will.

The marked issues are fixed by implementing a database over a non-permanent data structure.

## User Fetch Issue
~~The user parameter is undefined in the `messagereactionAdd` event listener UNTIL a new post is made while the bot is awake - 
then all subsequent reactions will have a fetchable user parameter. This behavior is unrelated to the message event listener and occurs even when said listener is not present.~~ Updating the discord.js version to 12.5.1 seems to have fixed the issue.