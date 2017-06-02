import {
  Template
} from 'meteor/templating';
import {
  ReactiveVar
} from 'meteor/reactive-var';

import {
  HTTP
} from 'meteor/http'
import './main.html';

Videos = new Mongo.Collection('videos');
Reactions = new Mongo.Collection('reactions');
//GLOBAL ARRAYS
SearchList = new Array();
// GLOBAL FUNCTIONS

convertDuration = function (duration) {
  var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return String(minutes + ":" + seconds);
}

insertVideo = function (videoId, videoTitle, videoThumb) {
  Videos.insert({
    _id: videoId,
    videoId: videoId,
    videoTitle: videoTitle,
    videoThumb: videoThumb,
    videoStatus: "Na fila",
    videoLike: 0,
    videoDislike: 0,
    videoPercent: 1
  }, function (error) {
    if (error) {
      //Duplicate music error
      Materialize.toast('Está musica já está na playlist!', 3000, 'red');
    } else {
      //Get video duration
      var ytresponse_video = HTTP.call('GET', 'https://www.googleapis.com/youtube/v3/videos?id=' + videoId + '&part=contentDetails&key=AIzaSyBQ42sEnmmjDafk7UCL4LqUbqbFwyaJpgk', {
        params: {}
      }, function (error, response) {
        if (error) {
          alert("Error while searching.");
        } else {
          //Json manipulation
          var parsed = JSON.parse(response.content);
          var videoDuration = convertDuration(parsed.items[0].contentDetails.duration);
          if (videoDuration.split(":")[0] < 10) {
            // Update
            Videos.update({
              _id: videoId
            }, {
              $set: {
                videoDuration: videoDuration,
              }
            }, function (error) {
              if (error) {
                console.log(error)
              }
            })
            Materialize.toast('Musica inserida!', 2000, 'green');
          } else {
            Videos.remove(videoId);
            Materialize.toast('Duração excessiva!', 3000, 'red');
          }
        }
      })
    }
  });
}

//HELPERS

Template.MainPage.helpers({
  //Return all videos on database

  videos: function () {
    json_videos = Videos.find().fetch();
    json_videos.forEach(function (element, index) {
      //for likes
      if (Meteor.user().profile.likes.indexOf(element._id) != -1) {
        json_videos[index].like = true;
      } else {
        json_videos[index].like = false;
      }
      //for dislikes
      if (Meteor.user().profile.dislikes.indexOf(element._id) != -1) {
        json_videos[index].dislike = true;
      } else {
        json_videos[index].dislikes = false;
      }
    });
    return json_videos;
  }
});

// FORM EVENTS

Template.MainPage.events({

  'submit .new_video': function (event) {
    var search = event.target.link.value;
    if (search == "") {
      Materialize.toast('Campo de pesquisa vazio!', 3000, 'red');
      return false;
    } else {
      MaterializeModal.loading()
      // get 10 videos
      var ytresponse_search = HTTP.call('GET', 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&type=video&order=viewCount&q=' + search + '&key=AIzaSyBQ42sEnmmjDafk7UCL4LqUbqbFwyaJpgk', {
        params: {}
      }, function (error, response) {
        if (error) {
          //alert error
          alert("Error while searching.");
        } else {
          //json manipulation...
          var parsed = JSON.parse(response.content);
          if (parsed.items.length >= 10) {
            for (i = 0; i < 10; i++) {
              "fa fa-thumbs-up fa-2x"
              // populate array
              var videoId = parsed.items[i].id.videoId;
              var videoThumb = parsed.items[i].snippet.thumbnails.medium.url;
              var videoTitle = parsed.items[i].snippet.title;
              if (videoTitle.length > 50) videoTitle = videoTitle.substring(0, 50) + '...';
              SearchList.push({
                "listNumber": i,
                "videoId": videoId,
                "videoTitle": videoTitle,
                "videoThumb": videoThumb
              })
            }
            //show modal
            MaterializeModal.display({
              bodyTemplate: 'List',
              closeLabel: 'Fechar'
            });
          } else {
            Materialize.toast('Pesquisa inválida. Tente outro termo para a pesquisa.', 3000, 'red');
            MaterializeModal.close();
          }
        }
      })
      //clean target value and array
      event.target.title.value = "";
      document.getElementById("text_field").value = "";
      SearchList = [];
      return false;
    }
  },
  'click #like': function (event) {
    reaction = $("#" + event.target.id).attr("class")
    if (reaction == "fa fa-thumbs-up fa-2x") {
      //like off
      url = event.target.id.substring(1);
      //update like counter
      Videos.update({
        _id: url
      }, {
        $inc: {
          'videoLike': -1
        }
      }, true);
      // update like array
      Meteor.users.update({
        _id: Meteor.user()._id,
      }, {
        $pull: {
          "profile.likes": url,
        }
      }, function (error) {
        if (error) console.log(error);
      });
    } else {
      //like on
      url = event.target.id.substring(1);
      //update like counter
      Videos.update({
        _id: url
      }, {
        $inc: {
          'videoLike': 1
        }
      }, true);
      //update like array
      Meteor.users.update({
        _id: Meteor.user()._id,
      }, {
        $push: {
          "profile.likes": url
        }
      }, function (error) {
        if (error);
      });
    }
  },
  'click #dislike': function (event) {
    reaction = $("#" + event.target.id).attr("class")
    if (reaction == "fa fa-thumbs-down fa-2x") {
      //dislike off      
      url = event.target.id.substring(1);
      //update dislike counter
      Videos.update({
        _id: url
      }, {
        $inc: {
          'videoDislike': -1
        }
      }, true);
      //update dislike array
      Meteor.users.update({
        _id: Meteor.user()._id,
      }, {
        $pull: {
          "profile.dislikes": url
        }
      }, function (error) {
        if (error);
      });
    } else {
      //dislike on
      url = event.target.id.substring(1);
      //update dislike counter
      Videos.update({
        _id: url
      }, {
        $inc: {
          'videoDislike': 1
        }
      }, true);
      //update dislike array
      Meteor.users.update({
        _id: Meteor.user()._id,
      }, {
        $push: {
          "profile.dislikes": url
        }
      }, function (error) {
        if (error);
      });
    }
  },
});

Template.body.events({
  'click #nav-mobile': function (event) {
    MaterializeModal.display({
      bodyTemplate: 'Helpme',
      closeLabel: 'Fechar'
    });
  }
});

//PLAYER

window.onYouTubeIframeAPIReady = function () {
  //First video
  var Id = Videos.findOne()

  if (!Id) {
    Id = ({
      videoId: "DID8g3sleTs"
    });
  } else {
    Videos.update({
      _id: Id._id
    }, {
      $set: {
        videoStatus: "Tocando"
      }
    });
  }
  // New Video Player, the first argument is the id of the div.
  // Make sure it's a global variable.
  player = new YT.Player("player", {

    height: "400",
    width: "600",
    videoId: Id.videoId,

    // Events like ready, state change, 
    events: {

      onReady: function (event) {

        // Play video when player ready.
        event.target.playVideo();
      },
      onStateChange: function (event) {
        // Ended Video
        if (event.data == YT.PlayerState.ENDED) {
          // Remove video on database
          if (Id.videoId != "DID8g3sleTs") {
            Videos.remove({
              _id: Id._id
            })
          }

          // Search new video
          var label = false;
          do {
            Id = Videos.findOne()
            var percent = 1;
            if (Id != undefined) {
              if (!(Id.videoDislike == 0 && Id.videoLike == 0) || !(Id.videoDislike == 1 && Id.videoLike == 0)) {
                percent = Id.videoLike / (Id.videoDislike + Id.videoLike);
                if (percent < 0.3) {
                  Videos.remove(Id.videoId);
                } else {
                  Videos.update({
                    _id: Id._id
                  }, {
                    $set: {
                      videoStatus: "Tocando"
                    }
                  });
                  label = true;
                }
              }
            } else {
              //Empty list
              label = true;
              Id = ({
                videoId: "DID8g3sleTs",
              });
            }
          } while (!label);
          //Load new video
          console.log(Id)
          player.loadVideoById(Id.videoId)
        }
      }
    }
  });
}

// Load player
YT.load();