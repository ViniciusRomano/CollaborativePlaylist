import {
    HTTP
} from 'meteor/http'


Router.route('/', function () {
    this.render('MainPage');
});

Router.route('/player', function () {
    this.render('player');
});