var app = angular.module('Filters.common', []);


app.filter('tcToArray', function() {
    return function(obj, addKey) {
        if (!angular.isObject(obj)) return obj;
        if (addKey === false) {
            return Object.keys(obj).map(function(key) {
                return obj[key];
            });
        } else {
            return Object.keys(obj).map(function(key) {
                var value = obj[key];
                return angular.isObject(value) ?
                    Object.defineProperty(value, '$key', {
                        enumerable: false,
                        value: key
                    }) : {
                        $key: key,
                        $value: value
                    };
            });
        }
    };
});

app.filter('tcEmoticon', function() {
    return function(message, emoticons) {
        return message.split(' ').map(function(word) {
                var emot = emoticons[word];
                if (emot) {
                    return '<img src="'+emot.url+'" alt="'+word+'"/>';
                }else{
                    return word;
                }
            }).join(' ');
    };
});