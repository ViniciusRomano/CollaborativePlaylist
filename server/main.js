import {
  Meteor
} from 'meteor/meteor';

Videos = new Mongo.Collection('videos');

Meteor.startup(() => {
  // code to run on server at startup
  // Clean database
  Videos.remove({});
});