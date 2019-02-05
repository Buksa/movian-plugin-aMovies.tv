/**
 * aMOvies plugin for Movian
 *
 *  Copyright (C) 2015 Buksa
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
//ver 1.1.1
var plugin = JSON.parse(Plugin.manifest);

var PREFIX = plugin.id;
var LOGO = Plugin.path + 'logo.png';
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25';
var page = require('showtime/page');
var service = require('showtime/service');
var settings = require('showtime/settings');
var io = require('native/io');
var prop = require('showtime/prop');
var log = require('./src/log');
var browse = require('./src/browse');
var api = require('./src/api');

var http = require('showtime/http');
var html = require('showtime/html');
var result = '',  referer = BASE_URL,  data = {},  sss = {};

var tos = 'The developer has no affiliation with the sites what so ever.\n';
tos += 'Nor does he receive money or any other kind of benefits for them.\n\n';
tos += 'The software is intended solely for educational and testing purposes,\n';
tos += 'and while it may allow the user to create copies of legitimately acquired\n';
tos += 'and/or owned content, it is required that such user actions must comply\n';
tos += 'with local, federal and country legislation.\n\n';
tos += 'Furthermore, the author of this software, its partners and associates\n';
tos += 'shall assume NO responsibility, legal or otherwise implied, for any misuse\n';
tos += 'of, or for any loss that may occur while using plugin.\n\n';
tos += 'You are solely responsible for complying with the applicable laws in your\n';
tos += 'country and you must cease using this software should your actions during\n';
tos += 'plugin operation lead to or may lead to infringement or violation of the\n';
tos += 'rights of the respective content copyright holders.\n\n';
tos += 'plugin is not licensed, approved or endorsed by any online resource\n ';
tos += 'proprietary. Do you accept this terms?';
console.log(Core.storagePath)
io.httpInspectorCreate('http.*?amovies\..*/', function (ctrl) {
  ctrl.setHeader('User-Agent', UA);
  ctrl.setHeader('Referer', service.domain);
  return 0;
});
// io.httpInspectorCreate('https://.*moonwalk.cc/.*', function (ctrl) {
//   ctrl.setHeader('User-Agent', UA);
//   return 0;
// });
// io.httpInspectorCreate('https://.*hdgo.cc/.*', function (ctrl) {
//   ctrl.setHeader('User-Agent', UA);
//   ctrl.setHeader('Referer', 'http://hdgo.cc');
//   return 0;
// });

// io.httpInspectorCreate('http.*?\\/video\\/\\d+.*?[a-f0-9]{32}.mp4', function (ctrl) {
//   ctrl.setHeader('User-Agent', UA);
//   ctrl.setHeader('Referer', 'http://hdgo.cx');
//   return 0;
// });
// Create the service (ie, icon on home screen)
service.create(plugin.title, PREFIX + ':start', 'video', true, LOGO);

settings.globalSettings(plugin.id, plugin.title, LOGO, plugin.synopsis);
settings.createInfo('info', LOGO, 'Plugin developed by ' + plugin.author + '.');

settings.createDivider('Settings:');
settings.createBool('tosaccepted', 'Accepted TOS (available in opening the plugin)', false, function (v) {
  service.tosaccepted = v;
});
settings.createString("domain", "\u0414\u043e\u043c\u0435\u043d", "http://amovies.cc", function (v) {
    service.domain = v;
});
settings.createBool('debug', 'Debug', false, function (v) {
  service.debug = v;
});
settings.createBool('thetvdb', 'Show more information using thetvdb', false, function (v) {
  service.thetvdb = v;
});

var BASE_URL = service.domain;

function blueStr(str) {
  //return '<font color="6699CC"> (' + str + ')</font>';
  return ' (' + str + ')';
}

new page.Route(PREFIX + ':browse:(.*):(.*)', function (page, href, title) {
  browse.list(page, {
    href: href,
    title: title
  });
});

new page.Route(PREFIX + ':moviepage:(.*)', function (page, href) {
  browse.moviepage(page, href);
});

new page.Route(PREFIX + ':play:(.*)', function (page, data) {
  var canonicalUrl = PREFIX + ':play:' + data;
  data = JSON.parse(data);
  log.d({
    function: 'play',
    data: data
  });

  var videoparams = {
    canonicalUrl: canonicalUrl,
    no_fs_scan: true,
    title: data.second_name,
    year: data.year ? data.year : 0,
    season: data.season ? data.season : -1,
    episode: data.episode ? data.episode : -1,
    sources: [{
      url: []
    }],
    subtitles: []
  };
  api.call(page, data.url, null, function (pageHtml) {
    log.d(pageHtml.text.toString());
    content = pageHtml.text.toString();
    regExp = /url:.*?'((.*?(?:mp4|\.flv)))/g;
    while ((itemData = regExp.exec(content)) !== null /*&& (i <= numItems)*/ ) {
      console.log(itemData)
      videoparams.sources = [{
        url: 'http:'+itemData[1]
        //  mimetype: /mp4/.test(itemData[1])? 'video/mp4' :''
      }];
      type = /mp4/.test(itemData[1]) ? '[MP4]' : '[FLV]';
      resolution = /(\d+)-/.test(itemData[1]) ? '-' + /(\d+)-/.exec(itemData[1])[1] + '-' : '-';
      data.video_url = itemData[1];
      video = 'videoparams:' + JSON.stringify(videoparams);
      page.appendItem(video, 'video', {
        title: type + resolution + data.title,
        backdrops: [{
          url: /poster.*?'(.+?)'/.exec(content)[1]
        }],
        icon: 'cover' //icon: data.poster
      });
    }
  });
  // }
  page.appendItem('search:' + data.second_name, 'directory', {
    title: 'найти ' + data.second_name
  });
  page.type = 'directory';
  page.metadata.logo = LOGO;
  page.loading = false;
});

new page.Route(PREFIX + ':video:(.*)', videoPage);

new page.Route(PREFIX + ':search:(.*)', function (page, query) {
  page.metadata.icon = LOGO;
  page.metadata.title = 'Search results for: ' + query;
  browse.search(page, query);
});

page.Searcher(PREFIX + ' - Videos', LOGO, function (page, query) {
  browse.search(page, query);
});

// Landing page
new page.Route(PREFIX + ':start', function (page) {
  page.type = 'directory';
  page.metadata.title = plugin.title;
  page.metadata.icon = LOGO;

  page.appendItem(PREFIX + ':search:', 'search', {
    title: 'Search ' + plugin.title
  });

  page.appendItem(PREFIX + ':browse:/serials/:Сериалы', 'directory', {
    title: 'Сериалы'
  });
  page.appendItem(PREFIX + ':browse:/film/:Фильмы', 'directory', {
    title: 'Фильмы'
  });
  page.appendItem(PREFIX + ':browse:/multserialy/:Мультсериалы', 'directory', {
    title: 'Мультсериалы'
  });
  page.appendItem(PREFIX + ':browse:/cartoons/:Мультфильмы', 'directory', {
    title: 'Мультфильмы'
  });
  // page.appendItem(PREFIX + ':browse:/eng/:ENG', 'directory', {
  //   title: 'ENG'
  // });
});

function videoPage(page, data) {
  page.loading = true;
  var canonicalUrl = PREFIX + ':video:' + data;
  data = JSON.parse(unescape(data));

  var videoparams = {
    canonicalUrl: canonicalUrl,
    no_fs_scan: true,
    icon: data.icon,
    title: unescape(data.title),
    year: data.year ? data.year : '',
    season: data.season ? data.season : '',
    episode: data.episode ? data.episode : '',
    sources: [{
      url: []
    }],
    subtitles: []
  };

  if (data.url.match(/http:\/\/.+?iframe/)) {
    log.p('Open url:' + data.url.match(/http:\/\/.+?iframe/));
    log.p('Open url:' + data.url);
    resp = http
      .request(data.url, {
        method: 'GET',
        headers: {
          Referer: BASE_URL
        }
      })
      .toString();
    log.p('source:' + resp);
    var content = parser(resp, '|14', '|');
    content = Duktape.enc('base64', 14 + content);
    var csrftoken = parser(resp, 'csrf-token" content="', '"');
    var request = parser(resp, 'request_host_id = "', '"');
    var video_token = parser(resp, "video_token: '", "'");
    var partner = parser(resp, 'partner: ', ',');
    var content_type = parser(resp, "content_type: '", "'");
    var access_key = parser(resp, "access_key: '", "'");
    var request_host = parser(resp, 'request_host = "', '"');
    var params =
      'partner=' +
      partner +
      '&d_id=' +
      request +
      '&video_token=' +
      video_token +
      '&content_type=' +
      content_type +
      '&access_key=' +
      access_key +
      '&cd=1';
    log.p(params);

    //Request URL:http://moonwalk.cc/sessions/create_new
    //Request Method:POST

    //Accept:*/*
    //Accept-Encoding:gzip, deflate
    //Accept-Language:en-US,en;q=0.8,zh;q=0.6,zh-CN;q=0.4,zh-TW;q=0.2,ru;q=0.2
    //Cache-Control:no-cache
    //Connection:keep-alive
    //Content-Length:103
    //Content-Type:application/x-www-form-urlencoded; charset=UTF-8
    //Cookie:_gat=1; _moon_session=UVc2MTVMSUtKRS9uekJ1VVVYZHZYMHo0eXlFYUhWV3pHQUVTQkovMFlwMVpwbVkya0R1ODBsYmpvOGJleXgzbStiTGt4Vzk4Q05uc2tKemFNS014UG0xMG95V0w3SWZtQnNmd1RYS2RXWUd6M2xXN1c4bUxiMVY3S1VtejAxYi9YUjc1WDZlSmJDN3VWWDZTdXo0eG81K3cweENzTk90akNUSTRlYUR2SGRtbkVEWTNtL0ZVS1JPZGpwS3lMK3RmLS0wdEVGeGxUUXZIOUZPckpFbWRveDN3PT0%3D--9edce6c8b125d6fe74124b98dc2bf393522fbcb1; _ga=GA1.2.896944432.1465011956; _364966110049=1; _364966110050=1468124044712
    //Encoding-Pool:MTQ2ODEyMzQwMDphOGM4ZDY3NWVlZGNjNzYzNmRmNGI2MTk4ZTk3N2Q4OQ==
    //Host:moonwalk.cc
    //Origin:http://moonwalk.cc
    //Pragma:no-cache
    //Referer:http://moonwalk.cc/serial/5db10bbffad49d31db8303097e2c8b26/iframe
    //User-Agent:Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36
    //X-CSRF-Token:92xrNPRaiNmCTFwvW/WZtng1AJqBD0LCPlpdRTqM4UFk7eEPM5+Di/daiYQKdl47A1OGlpt1gZeH23eLuGYSVQ==
    //X-Requested-With:XMLHttpRequest
    //Form Data
    //view parsed
    //partner=28&d_id=130&video_token=f26d62751fcf09c9&content_type=serial&access_key=0fb74eb4b2c16d45fe&cd=0
    //Name

    var url1 = data.url.match(/http:\/\/.*?\//).toString() + 'sessions/create_new';
    var responseText = http
      .request(url1, {
        debug: 1,
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,zh;q=0.6,zh-CN;q=0.4,zh-TW;q=0.2,ru;q=0.2',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Encoding-Pool': content,
          Referer: data.url.match(/http:\/\/.+?iframe/),
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
          'X-CSRF-Token': csrftoken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        postdata: params
      })
      .toString();
    log.p(parser(resp, "insertVideo('", "'"));
    title = parser(resp, "insertVideo('", "'");
    page.metadata.title = title;
    json = JSON.parse(responseText);
    log.p(json);
    result_url = 'hls:' + json.manifest_m3u8;
    videoparams.sources = [{
      url: 'hls:' + json.manifest_m3u8
    }];
    video = 'videoparams:' + JSON.stringify(videoparams);
    page.appendItem(video, 'video', {
      title: '[Auto]' + ' | ' + title,
      icon: data.icon
    });
    var video_urls = http.request(json.manifest_m3u8).toString();
    log.p(video_urls);
    var myRe = /RESOLUTION=([^,]+)[\s\S]+?(http.*)/g;
    var myArray,
      i = 0;
    while ((myArray = myRe.exec(video_urls)) !== null) {
      videoparams.sources = [{
        url: 'hls:' + myArray[2]
      }];
      video = 'videoparams:' + JSON.stringify(videoparams);
      page.appendItem(video, 'video', {
        title: '[' + myArray[1] + ']' + ' | ' + title,
        icon: data.icon
      });
      i++;
    }
  }

  page.appendItem('search:' + data.title, 'directory', {
    title: 'Try Search for: ' + data.title
  });

  page.type = 'directory';
  page.contents = 'contents';
  page.metadata.logo = data.icon;
  page.loading = false;
}

function parser(a, c, e) {
  var d = '',
    b = a.indexOf(c);
  0 < b && ((a = a.substr(b + c.length)), (b = a.indexOf(e)), 0 < b && (d = a.substr(0, b)));
  return d;
}