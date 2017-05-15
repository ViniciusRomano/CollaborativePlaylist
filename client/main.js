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
SearchListEx = [{

  "videoTitle": "Titulo",
  "videoStatus": "ALAAL",
  "videoDuration": "3:00"

}]

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
    videoStatus: "Na fila"
  }, function (error) {
    if (error) {
      //Duplicate music error
      Materialize.toast('Está musica já está na playlist!', 3000, 'red');
    } else {
      Materialize.toast('Musica inserida!', 2000, 'green');
    }
  })

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
    }
  })
}

//HELPERS

Template.MainPage.helpers({
  //Return all videos on database

  videos: function () {
    return Videos.find();
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
      // get 20 videos
      MaterializeModal.loading()
      var ytresponse_search = HTTP.call('GET', 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&type=video&order=viewCount&q=' + search + '&key=AIzaSyBQ42sEnmmjDafk7UCL4LqUbqbFwyaJpgk', {
        params: {}
      }, function (error, response) {
        if (error) {
          //alert error
          alert("Error while searching.");
        } else {
          //json manipulation...
          var parsed = JSON.parse(response.content);
          // populate array
          for (i = 0; i < 20; i++) {
            var videoId = parsed.items[i].id.videoId;
            var videoThumb = parsed.items[i].snippet.thumbnails.medium.url;
            var videoTitle = parsed.items[i].snippet.title;
            if (videoTitle.length > 70) videoTitle = videoTitle.substring(0, 70) + '...';
            SearchList.push({
              "listNumber": i,
              "videoId": videoId,
              "videoTitle": videoTitle,
              "videoThumb": videoThumb
            })
          }
          //show modal
          MaterializeModal.display({
            bodyTemplate: 'List'
          });
        }
      })
      //clean target value and array
      event.target.title.value = "";
      SearchList = [];
      return false;
    }
  }
});

//PLAYER

window.onYouTubeIframeAPIReady = function () {

  // Catch first video
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
          Videos.remove({
            _id: Id._id
          })
          // Search new video
          Id = Videos.findOne()
          // Database empty
          if (!Id) {
            Id = ({
              videoId: "DID8g3sleTs"
            });
          } else {
            // Update video status
            Videos.update({
              _id: Id._id
            }, {
              $set: {
                videoStatus: "Tocando"
              }
            });
          }
          //Load new video
          player.loadVideoById(Id.videoId)
        }
      }
    }
  });
}

// Load player
YT.load();