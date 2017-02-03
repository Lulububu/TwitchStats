angular.module('Controllers.stats', []).controller('StatController', StatController);

StatController.$inject = ['$scope', '$interval', '$location', '$filter', '$window', '$http', '$stateParams', 'tcConfig'];


function StatController($scope, $interval, $location, $filter, $window, $http, $stateParams, tcConfig) {

    var vm = this;

    activate();

    function activate() {


        $scope.data = {
            messagesPerMinute: [],
            pollution: []
        };

        $scope.calcul = {
            messagesPerMinute: {
                value: 0,
                date: new Date()
            },
            messagesPerSecondeLastMinute: [],
            messageSeconde: 0
        };

        $scope.pollution = {value : { value : 0}};
        $scope.messages = [];

        var channels = [];


        clientOptions = {
            options: {
                showTooltips: true,
                debug: false
            },
            channels: channels
        },
        client = new tmi.client(clientOptions);

        function handleMessage(channel, user, message, self) {
            console.log(message);
            $scope.calcul.messageSeconde++;

            $scope.messages.push({
                message : message,
                user : user
            });

            if($scope.messages.length > 50) {
                $scope.messages.shift();
            }
        }




        client.addListener('message', handleMessage);


        client.addListener('connecting', function(address, port) {
            console.log('connecting to ' + address + ' : ' + port)
        });
        client.addListener('logon', function() {
            console.log('Authenticating');
        });
        client.addListener('connectfail', function() {
            console.log('Connection failed');
        });
        client.addListener('connected', function(address, port) {
            console.log('Connected');

            promise = $interval(function() {
                $scope.calcul.messagesPerSecondeLastMinute.unshift($scope.calcul.messageSeconde);
                if ($scope.calcul.messagesPerSecondeLastMinute.length > 60) {
                    $scope.calcul.messagesPerSecondeLastMinute.pop();
                }

                $scope.calcul.messagesPerMinute = {
                    value: Math.round($scope.calcul.messagesPerSecondeLastMinute.reduce(function(pv, cv) {
                        return pv + cv;
                    }) * 60 / $scope.calcul.messagesPerSecondeLastMinute.length),
                    date: new Date()
                };
                $scope.data.messagesPerMinute.push({
                    x: $scope.data.messagesPerMinute.length * 2,
                    y: $scope.calcul.messagesPerMinute.value
                });
                if ($scope.data.messagesPerMinute.length > 250) {
                    $scope.data.messagesPerMinute.shift();
                }

                $scope.calcul.messageSeconde = 0;
            }, 1000);

            var pollution = new PollutionComputer(client);
            $scope.pollution.value = pollution.getPollution();

            var emot = new EmoticonUseComputer(client, channels, $http, tcConfig);
            $scope.emoticon = {
                liste: emot.getEmoticonUse()
            };



            angular.element($window).bind('hashchange', function() {

                pollution.stop();

                $interval.cancel(promise);

                activate();

                client.disconnect();

            });

        });
        client.addListener('disconnected', function(reason) {
            console.log('Disconnected: ' + (reason || ''));
        });
        client.addListener('reconnect', function() {
            console.log('Reconnected');
        });
        client.addListener('join', function(channel, username) {
            console.log('Joined ' + channel);
        });
        client.addListener('part', function(channel, username) {});

        client.addListener('crash', function() {
            console.log('Crashed');
        });

        if ($stateParams.channel) {
            channels.push($stateParams.channel);
            client.connect();
        } else {
            $http.get('https://api.twitch.tv/kraken/streams', {
                headers : {
                    'Client-ID' : tcConfig.twitchAPIId
                }
            }).success(function(resultat) {

                resultat.streams.forEach(function(stream) {

                    channels.push(stream.channel.display_name);


                });
                client.connect();
            });
        }
    }
};