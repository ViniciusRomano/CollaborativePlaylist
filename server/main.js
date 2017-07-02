import {
  Meteor
} from 'meteor/meteor';

Videos = new Mongo.Collection('videos');


Meteor.startup(() => {
  // code to run on server at startup
  // Clean database
  Meteor.users.remove({})
  Accounts.removeOldGuests();;
  AccountsGuest.anonymous = true
  AccountsGuest.name = true
  // set permissions on user model
  Videos.remove({});
});