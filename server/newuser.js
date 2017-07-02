import {
    Meteor
} from 'meteor/meteor';

Accounts.onCreateUser(function (options, user) {
    Meteor.users.allow({
        insert() {
            return true;
        },
        update() {
            return true;
        },
        remove() {
            return true;
        },
    });
    user.profile['likes'] = [];
    user.profile['dislikes'] = [];
    return user;
});