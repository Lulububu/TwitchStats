var app = angular.module('twitchChat', ['ngAnimate', 'ui.router', 'Controllers.home', 'Controllers.stats', 'Directive.common', 'Filters.common', 'Constant.common', 'ngSanitize']);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/home");

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'app/home/home.html',
      controller : 'HomeController'
    })
    .state('stats', {
      url: '/stats/:channel',
      templateUrl: 'app/stats/stats.html',
      controller: 'StatController'
    });
});


function PollutionComputer(clientIrc) {
    var private = {
        handleMessage: function(channel, user, message, self) {
            var pollution = private.getMessagePollution(message);
            if (pollution.isPolluted) {
                private.numberMessagePollutedLastSecond++;
                var username = user['display-name'] || user['username']
                if (!private.pollution.worstPeople[username]) {
                    private.pollution.worstPeople[username] = {
                        numberMessagePolluted: 0,
                        user: user,
                        typePollutionSet: {},
                        typePollution: []
                    };
                }

                pollution.typePollution.forEach(function(type) {
                    private.pollution.worstPeople[username].typePollutionSet[type] = true;
                });
                private.pollution.worstPeople[username].typePollution = Object.keys(private.pollution.worstPeople[username].typePollutionSet);
                private.pollution.worstPeople[username].numberMessagePolluted++;
                private.pollution.worstPeople[username].lastSpamWord = pollution.spamWord || private.pollution.worstPeople[username].lastSpamWord;
                private.pollution.worstPeople[username].lastCapsMessage = pollution.capsMessage || private.pollution.worstPeople[username].lastCapsMessage;

                console.error('Beurk!')
            }
            private.numberMessageTotalLastSecond++;

            private.lastMessages.unshift(message);
            if (private.lastMessages.length > 20) {
                private.lastMessages.pop();
            }


        },
        getMessagePollution: function(message) {
            var currentMessageDict = {};
            var listMessageDict = {};
            var pollution = {
                isPolluted: false,
                typePollution: []
            };

            private.lastMessages.join(' ').split(' ').forEach(function(word) {
                if (word.length > 3) {
                    if (!listMessageDict[word]) {
                        listMessageDict[word] = 0;
                    }
                    listMessageDict[word]++;
                }
            });

            message.split(" ").forEach(function(word) {
                if (word.length > 3) {
                    if (!currentMessageDict[word]) {
                        currentMessageDict[word] = 0;
                    }
                    if (++currentMessageDict[word] > 2 || listMessageDict[word] > 2) {
                        pollution.isPolluted = true;
                        pollution.typePollution.push('SPAM');
                        pollution.spamWord = word;
                        console.error(word)
                    }
                }
            });

            if (((message.length - message.replace(/[A-Z]*/g, '').length) / message.length) > 0.5) {
                pollution.typePollution.push('CAPS');
                pollution.isPolluted = true;
                pollution.capsMessage = message;
            }


            return pollution;

        }
    }

    var public = {
        getPollution: function() {
            return private.pollution;
        },
        stop: function() {
            clearInterval(private.interval);
        }
    }

    activate();

    function activate() {
        client.addListener('message', private.handleMessage);

        private.pollutionPerSecondLasMinute = [];
        private.numberMessagePollutedLastSecond = 0;
        private.numberMessageTotalLastSecond = 0;
        private.pollution = {
            value: 0,
            worstPeople: {}
        };

        private.lastMessages = [];

        private.interval = setInterval(function() {
            if (private.numberMessageTotalLastSecond !== 0) {
                private.pollutionPerSecondLasMinute.unshift(private.numberMessagePollutedLastSecond / private.numberMessageTotalLastSecond);
            } else {
                private.pollutionPerSecondLasMinute.unshift(0);
            }

            if (private.pollutionPerSecondLasMinute.length > 60) {
                private.pollutionPerSecondLasMinute.pop();
            }

            private.pollution.value = private.pollutionPerSecondLasMinute.reduce(function(pv, cv) {
                return pv + cv;
            }) * 60 / private.pollutionPerSecondLasMinute.length;
            private.pollution.date = new Date();

            private.numberMessagePollutedLastSecond = 0;
            private.numberMessageTotalLastSecond = 0;

            if (this.updateCallback) {
                this.updateCallback(private.pollution.value);
            }
        }, 1000);


    }
    return public;
}




function EmoticonUseComputer(client, channelsName, $http, config) {
    var private = {
        handleMessage: function(channel, user, message, self) {
            message.split(' ').forEach(function(word) {
                var emot = private.emoticonUse[word];
                if (emot) {
                    emot.number++;
                }
            });
        }
    }

    var public = {
        getEmoticonUse: function() {
            return private.emoticonUse;
        },
        stop: function() {
            clearInterval(private.interval);
        }
    }

    activate();

    function activate() {
        client.addListener('message', private.handleMessage);
        console.log(client)
        private.emoticonUse = {};

        channelsName.forEach(function(channelName) {
            private.emotes = $http.get('https://api.twitch.tv/kraken/chat/' + channelName + '/emoticons', {
            	headers : {
            		'Client-ID' : config.twitchAPIId
            	}
            }).success(function(resultat) {

                resultat.emoticons.forEach(function(emoticone) {
                    private.emoticonUse[emoticone.regex] = emoticone;
                    private.emoticonUse[emoticone.regex].number = 0;
                });
            });
        })

    }
    return public;
}