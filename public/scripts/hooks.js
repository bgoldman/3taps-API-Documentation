var authId = 'fc275ac3498d6ab0f0b4389f8e94422c';
var agentId = '3taps-developers';
var threeTapsClient = new threeTapsClient(authId, agentId);

var Hooks = {
	setRunVars: function(targetId) {
		var client = targetId.split('.')[1].toLowerCase();
		clientCapitalized = client.substr(0, 1).toUpperCase() + client.substr(1);
		var clientVar = 'threeTaps' + clientCapitalized + 'Client';
		window[clientVar] = threeTapsClient[client];
	}
};
