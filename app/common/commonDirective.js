var app = angular.module('Directive.common', []);



app.directive('tcCounter', function() {
    return {
        scope: {
            messageNumber: '=tcCounterValue',
            label: '@tcCounterLabel',
            precision: '@tcCounterPrecision',
            color: '@tcCounterColor'
        },
        templateUrl: 'style/rate.svg'
    };
});





app.directive('tcChart', function() {
    return {
        scope: {
            input: '=tcChartInput',
            colorPrimary: '@tcChartColorPrimary',
            colorSecondary: '@tcChartColorSecondary'
        },
        templateUrl: 'style/chart.svg',
        link: function(scope, element, attr) {
            scope.viewPort = 0;
            scope.curseur = {
                x: 0
            };
            scope.inputArray = [];

            element.bind("DOMMouseScroll mousewheel onmousewheel", function(event) {
                var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

                if (delta < 0) {
                    scope.viewPort += 10;
                } else {
                    scope.viewPort -= 10;
                }

                event.preventDefault();
            });



            scope.$watch(function(){return scope.input}, function() {

                if (scope.input) {
                    scope.inputArray.push({
                        y: scope.input.value
                    });
                    if (scope.inputArray.length > 250) {
                        scope.inputArray.shift();
                    }
                    var maxValue = Math.max.apply(Math, scope.inputArray.map(function(o) {
                        return o.y
                    }));
                    maxValue = maxValue || 1;
                    var i = 0;
                    scope.path = scope.inputArray.map(function(point) {
                        i++;
                        return i * 2 + ',' + computeY(point, maxValue);
                    }).join(' L ') + 'L' + (scope.inputArray.length * 2) + ',150 L 0,150';

                    scope.curseur = {
                        x: (scope.inputArray.length * 2),
                        y: computeY(scope.inputArray[scope.inputArray.length - 1], maxValue),
                        value: Math.round(scope.inputArray[scope.inputArray.length - 1].y)
                    }
                }
            }, true);

            function computeY(point, maxValue) {
                return (150 - ((point.y / maxValue) * 150));
            }
        }
    };
});

app.directive('tcChannelSearch', ChannelSearch);

ChannelSearch.$inject = ['$http', 'tcConfig'];


function ChannelSearch($http, tcConfig) {
    return {
        scope : {
            inputTitle : '@tcChannelSearchInputTitle'
        },
        template : `<div class="channel-selection-form">
        <input ng-model=channel placeholder="{{inputTitle}}" ng-change=updateSearch(channel) input-loading=loading></input>
        <div class="result-container" ng-if="channelResults.length > 0">
        <div class="channel-result" ng-repeat="result in channelResults" ui-sref="stats({channel : result.channel.name})">
        <span class="channel-logo"><img ng-src="{{result.channel.logo || '//static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png'}}"></span>
        <span class="channel-name">{{result.channel.display_name}}</span>
        <span class="stream-title">{{result.channel.status}}</span>     
        <span class="stream-preview"><img ng-src="{{result.preview.small}}"></span> 
        </div>
        </div>
        </div>`,
        link : function(scope, element, attr) {
            scope.updateSearch = updateSearch;

            function updateSearch(search) {
                $http.get("https://api.twitch.tv/kraken/search/streams?q=" + search, {
                    headers : {
                        'Client-ID' : tcConfig.twitchAPIId
                    }
                })
                .success(function(response) {
                    scope.channelResults = response.streams;
                    console.log(scope.channelResults)
                });
            }
        }
    }
    
}