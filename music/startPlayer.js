const {createAudioPlayer, NoSubscriberBehavior} = require('@discordjs/voice');

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Stop,
	},
});

//https://discordjs.guide/voice/audio-player.html#cheat-sheet