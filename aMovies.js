/*
 *  aMovies  - Movian Plugin
 *
 *  Copyright (C) 2014-2015 Buksa
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
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
//ver 0.5.7

var http = require('showtime/http');
var html = require('showtime/html');

(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    // bazovyj adress saita
    var BASE_URL = 'http://amovies.org';
    var USER_AGENT = 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:16.0) Gecko/20120815 Firefox/16.0';
    //logo
    var logo = plugin.path + 'logo.png';
    //tos
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
    tos += "plugin is not licensed, approved or endorsed by any online resource\n ";
    tos += "proprietary. Do you accept this terms?";
    // Register a service (will appear on home page)
    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);
    //settings
    var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    settings.createDivider('Settings:');
    settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin):", false, function(v) {
        service.tosaccepted = v;
    });
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    settings.createBool("thetvdb", "Show more information using thetvdb", false, function(v) {
        service.thetvdb = v;
    });
    settings.createInt("Min.Delay", "Интервал запросов к серверу (default: 3 сек)", 3, 1, 10, 1, 'сек', function(v) {
        service.requestMinDelay = v;
    });

    function start_block(page, href, title, num) {
        page.appendItem("", "separator", {
            title: new showtime.RichText(title)
        });
        var list = listScraper(BASE_URL + href, false);
        for (var i = 0; i < (num === 0 ? list.length : num); i++) {
            page.appendItem(PREFIX + ":page:" + escape(list[i].url), "video", {
                title: new showtime.RichText(list[i].title + (list[i].tag ? ' | ' + list[i].tag : '')),
                description: list[i].description ? new showtime.RichText(list[i].description) : list[i].title,
                icon: new showtime.RichText(list[i].image)
            });
        }
        page.appendItem(PREFIX + ":browse:" + href + ":" + title, "directory", {
            title: ('Дальше больше') + ' ►',
            icon: logo
        });

    }


    //First level start page
    plugin.addURI(PREFIX + ":start", function(page) {
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = PREFIX;
        if (!service.tosaccepted) if (popup.message(tos, true, true)) service.tosaccepted = 1;
            else {
                page.error("TOS not accepted. plugin disabled");
                return;
            }
        page.type = "directory";
        page.contents = "items";
        start_block(page, '/serials/', 'Новые серии', 15)
        start_block(page, '/katalog-serialov/', 'Новые сериалы', 5)
        // start_block(page, '/film/', 'Новые фильмы', 5)
        start_block(page, '/cartoons/', 'Мультфильмы', 5)
        // start_block(page, '/eng/', 'Серии ENG', 5)

        page.contents = "items";
        page.loading = false;
    });
    //Second level
    plugin.addURI(PREFIX + ":browse:(.*):(.*)", browseListPage);

    function browseListPage(page, href, title) {

        var re, v, m;
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";

        page.metadata.title = new showtime.RichText(PREFIX + ' | ' + title);

        //page.appendItem(PREFIX + ':start', 'directory', {
        //    title: new showtime.RichText('сортировка по : ' + title)
        //});

        p('vyzov function browseListPage' + 'page' + href + title)
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = plugin.path + "logo.png";

        var respond = '';
        var url = '';
        p(BASE_URL + href);
        var pageNumber = 1;
        var list;
        var requestFinished = true,
            lastRequest = 0;



        function loader() {
            if (!requestFinished) {
                p("Request not finished yet, exiting");
                return false;
            }

            var delay = countDelay(service.requestMinDelay * 1000, lastRequest);
            var loadItems = function() {
                try {
                    lastRequest = Date.now();
                    requestFinished = false;
                    p("Time to make some requests now!");
                    //make request here

                    p("L:" + BASE_URL + href + "page/" + pageNumber);
                    list = listScraper(BASE_URL + href + 'page/' + pageNumber + '/', false);
                    pageNumber++;

                    requestFinished = true;
                    p("Request finished!");
                    return list;
                } catch (err) {
                    //end of pages
                    if (err.message == 'HTTP error: 404') {
                        popup.notify("Достигнут конец директории.", 5);
                        return false;
                    }
                    //most probably server overload
                    else {
                        p(err)
                        popup.notify("Подгрузка не удалась. Возможно, сервер перегружен.", 5);
                        //trying to reload the page
                        pageNumber--;
                        return true;
                    }
                }
            };
            //print("Let's wait " + delay + " msec before making a request!");
            sleep(delay);
            var list = loadItems();

            for (var i = 0; i < list.length; i++) {
                page.appendItem(PREFIX + ":page:" + escape(list[i].url), "video", {
                    title: new showtime.RichText(list[i].title + (list[i].tag ? ' | ' + list[i].tag : '')),
                    description: list[i].description ? new showtime.RichText(list[i].description) : list[i].title,
                    icon: new showtime.RichText(list[i].image)
                });
            }

            return true;
        }

        loader();
        page.paginator = loader;

        page.loading = false;

        //code
    }

    function listScraper(url, respond) {
        p('function listScraper (url=' + url + ',respond=' + respond + ')')
        if (!respond) {
            respond = http.request(url, {
                debug: service.debug,
                method: 'GET',
                headers: {
                    'User-Agent': USER_AGENT
                }
            }).toString();
        }
        //p("####################")
        //var dom = html.parse(respond)
        //var dle_content = dom.root.getElementById('dle-content')
        //p(dle_content.getElementByTagName('li'))
        //p("####################")
        //
        //        //1 = data 2 = img 3= href  4 = title 5 = tag
        var re = /<div class="date">(.+?)<[\S\s]+?img src="([^"]+)[\S\s]+?<a href="http:\/\/amovies.org([^"]+)">([^<]+)[\S\s]+?<span>(.*)>/g;

        var items = new Array(),
            i = 0;

        var item = re.exec(respond);
        //print(item)
        while (item) {
            p("Found title:" + item[4]);
            p(item[5])
            items.push({
                url: item[3],
                title: item[4],
                tag: item[5].replace('<br /></span', '').replace('<br />', ' | ').replace('</span', ''),
                image: item[2],
                description: ("Updated: " + item[1])
            });
            item = re.exec(respond);
        }

        //	re = /<div class="img">[\S\s]{0,300}<img src="(\S*)"/g;
        //	item = re.exec(respond);
        //	while(item) {
        //	  p(item[1]);
        //	  items[i].image = item[1];
        //	  i++;
        //
        //	  item = re.exec(respond);
        //	}

        p('Returning list with ' + items.length + ' items');
        return items;
    };

    //plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, link, title) {
    //    var re, v, m;
    //    page.contents = "items";
    //    page.type = "directory";
    //    page.metadata.logo = plugin.path + "logo.png";
    //v = http.request(BASE_URL + link, {
    //         debug: service.debug,
    //         method: 'GET',
    //         headers: {
    //             'User-Agent': USER_AGENT
    //         }
    //     }).toString();
    //    page.metadata.title = new showtime.RichText(PREFIX + ' | ' + (/<title>(.*?)<\/title>/.exec(v)[1]));
    //    re = /<title>(.*?)<\/title>/;
    //    m = re.exec(v);
    //    page.appendItem(PREFIX + ':start', 'directory', {
    //        title: new showtime.RichText('сортировка по : ' + m[1])
    //    });
    //    var offset = 1;
    //    //var total_page = parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10);
    //
    //    function loader() {
    //        //http://amovies.org/serials/page/2/
    //        var v = http.request(BASE_URL + link + 'page/' + offset + '/', { debug: service.debug, method: 'GET', headers: {'User-Agent': USER_AGENT}}).toString();
    //        var has_nextpage = false;
    //        var match = v.match(/<ul class="ul_clear navigation">[\S\s]+?"http:\/\/amovies.org(.+?)"><li>Вперед<\/li><\/a>/);
    //        if (match) has_nextpage = true
    //        re = /<div class="date">(.+?)<[\S\s]+?img src="([^"]+)[\S\s]+?<a href="http:\/\/amovies.org([^"]+)">([^<]+)[\S\s]+?<span>(.+?)<\/span>/g;
    //        m = re.execAll(v);
    //        for (var i = 0; i < m.length; i++) {
    //            // p(m[i][1]+'\n'+m[i][2]+'\n'+m[i][3]+'\n')
    //            page.appendItem(PREFIX + ":page:" + m[i][3], "video", {
    //                title: new showtime.RichText(m[i][4] + ' | ' + m[i][5].replace('<br />', ' | ')),
    //                description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1]),
    //                icon: m[i][2]
    //            });
    //        }
    //        //if (nnext) {
    //        //page.appendItem(PREFIX + ':index:' + nnext, 'directory', {
    //        //    title: new showtime.RichText('Вперед')
    //        //});
    //        //}
    //        //var nnext = match(/<ul class="ul_clear navigation">[\S\s]+?"http:\/\/amovies.org(.+?)"><li>Вперед<\/li><\/a>/, v, 1);
    //        ////p('nnext='+nnext+' !nnext='+!nnext+' !!nnext='+!!nnext)
    //        offset++;
    //        return has_nextpage;
    //        // return offset < parseInt(/<div class="navigation[\S\s]+?nav_ext[\S\s]+?">([^<]+)/.exec(v)[1], 10)
    //    }
    //    loader();
    //    page.loading = false;
    //    page.paginator = loader;
    //});
    plugin.addURI(PREFIX + ":page:(.*)", function(page, link) {
        var i, v, item, re, re2, m, m2, data = {};
        p('Open page: ' + BASE_URL + link);
        v = http.request(BASE_URL + link, {
            debug: service.debug,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT
            }
        }).toString();
        var dom = html.parse(v)
        var article = dom.root.getElementByTagName('article')[0]
        p(article)
        var title = article.getElementByTagName('h1')[0].textContent
        var ico = article.getElementByTagName('img')[0].attributes.getNamedItem('src').value
        data.Referer = BASE_URL + link

        if (v.match(/<article class="post([\s\S]+)vk_comments/) != null) {
            post_full = v.match(/<article class="post([\s\S]+)vk_comments/)
            //print(post_full)
        } else {
            p(' Match attempt failed')
        }

        try {
            var md = {};
            md.title = title
            md.icon = article.getElementByTagName('img')[0].attributes.getNamedItem('src').value
            md.icon = md.icon.indexOf('http') !== -1 ? md.icon : BASE_URL + md.icon

            data.title = md.title;
            var ar_add_series = v.match(/class="title_d_dot">.*Архив добавления серий[\S\s]+?<\/div/);
            if (ar_add_series) {
                re = /: (.*?) \| ([0-9]+(?:\.[0-9]*)?) сезон/;
                md.season = parseInt(match(/(\d+) сезон/, ar_add_series, 1), 10);
                data.season = md.season;
                md.eng_title = match(/\|(.+?)\|/, ar_add_series, 1).trim();
                data.eng_title = match(/\|(.+?)\|/, ar_add_series, 1).trim()
            }

            md.year = +/Год[\S\s]+?(\d+)/.exec(post_full)[1]
            data.year = +md.year;
            md.status = match(/<li><strong>Статус:<\/strong><span>([^<]+)/, post_full, 1);
            md.genre = match(/<li><strong>Жанр:<\/strong><span>([^<]+)/, post_full, 1);
            md.duration = +match(/<li><strong>Время[\S\s]+?(\d+)/, post_full, 1);
            md.country = match(/<li><strong>Страна:<\/strong><span>(.+?)</, post_full, 1);
            md.rating = +match(/<li><strong>Рейтинг[\S\s]+?([0-9]+(?:\.[0-9]*)?)<\/strong>/, post_full, 1);
            md.director = match(/<li><strong>Режиссер:<\/strong><span>(.+?)<\/span>/, post_full, 1);
            md.actor = match(/<li><strong>Актеры:<\/strong><span>(.+?)<\/span><\/li>/, post_full, 1);
            md.description = match(/<div class="post_text">([\S\s]+?)<\/div>/, post_full, 1);
            page.metadata.title = md.title;
            //Трейлер:
            //
            //            page.appendItem("", "separator", {
            //    title: new showtime.RichText('Трейлер:')
            //});
            var json = http.request('https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=' + encodeURIComponent('Русский трейлер сериал ' + MetaTag(dom, 'og:title')) + '&key=AIzaSyCSDI9_w8ROa1UoE2CNIUdDQnUhNbp9XR4', {
                debug: service.debug,
                method: 'GET',
                headers: {
                    'User-Agent': USER_AGENT
                }
            }).toString();
            if (json.indexOf('"id"') !== -1) {
                json = JSON.parse(json);
                //             https://gdata.youtube.com/feeds/api/videos?q=Трейлер&max-results=1&v=2&alt=jsonc&orderby=published
                page.appendItem('youtube:video:simple:' + escape(page.metadata.title + " - " + 'Трейлер') + ":" + json.items[0].id.videoId, "video", {
                    title: 'Трейлер: ' + MetaTag(dom, 'og:title'),
                    icon: json.items[0].snippet.thumbnails.high.url
                });
            }
            if (article.getElementByClassName('arhive_news').length) {
                var arhive_news = article.getElementByClassName('arhive_news')[0]
                //for (i = 0 in arhive_news.children){
                for (i = 0; i < arhive_news.children.length; i++) {
                    if (arhive_news.children[i].getElementByTagName('strong').length) {
                        var season = arhive_news.children[i].getElementByTagName('strong')[0].textContent
                        page.appendItem("", "separator", {
                            title: new showtime.RichText(season)
                        });
                        for (j = 0; j < arhive_news.children[i].getElementByTagName('a').length; j++) {
                            if (arhive_news.children[i].getElementByTagName('a').length) {
                                var translate = arhive_news.children[i].getElementByTagName('a')[j].textContent
                                var href = arhive_news.children[i].getElementByTagName('a')[j].attributes.getNamedItem('href').value
                                p(href.match(/http:\/\/amovies.org\/(.*)/)[1])
                                page.appendItem(PREFIX + ":page:" + (href.match('http://amovies.org(.*)')[1]), "video", {
                                    title: new showtime.RichText(md.title + ' | ' + translate),
                                    year: md.year,
                                    icon: md.icon,
                                    genre: md.genre,
                                    duration: +md.duration,
                                    rating: +md.rating * 10,
                                    description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                                });

                            }
                        }
                    }
                }
            }


            if (link.indexOf('serials') != -1 || link.indexOf('cartoons') != -1) {
                //page.appendItem("youtube:searcher:video:" + 'Русский Трейлер ' + md.eng_title, "directory", {
                //    title: 'найти трейлер на YouTube'
                //});

                // var JSON = JSON.parse(http.request('http://query.yahooapis.om/v1/public/yql?q=use%20%22store%3A%2F%2FcruFRRY1BVjVHmIw4EPyYu%22%20as%20Untitled%3B%20SELECT%20Series.seriesid%20FROM%20Untitled%20WHERE%20seriesname%3D%22'+encodeURIComponent(s[0].trim())+'%22%20and%20language%3D%22ru%22%20|%20truncate%28count%3D1%29&format=json'))
                p('serials' + '\n' + link);
                //re = /value=(?:"http:\/\/vk.com\/|"http:\/\/rutube.ru\/|"http:\/\/videoapi.my.mail.ru\/)([^"]+)[\S\s]+?>([^<]+)/g;
                re = /value=(?:".*?)(oid=.+?&id=.+?&hash=[^&]+|videoapi.my.mail.ru\/[^"]+|couber.be\/[^"]+)[\S\s]+?>([^<]+)/g;
                m = re.execAll(v);
                if (m.toString()) {
                    for (i = 0; i < m.length; i++) {
                        data.url = m[i][1];
                        data.episode = +match(/([0-9]+(?:\.[0-9]*)?)/, m[i][2], 1);
                        data.title = md.eng_title
                        item = page.appendItem(PREFIX + ":play:" + escape(JSON.stringify(data)), "video", {
                            title: md.eng_title + ' | ' + md.season + ' сезон | ' + m[i][2],
                            season: +md.season,
                            imdbid: md.imdbid,
                            year: md.year,
                            icon: md.icon,
                            genre: md.genre,
                            duration: +md.duration,
                            rating: +md.rating * 10,
                            description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                        });
                        if (service.thetvdb) {
                            item.bindVideoMetadata({
                                title: md.title.split('езон')[0].trim(),
                                season: +md.season,
                                episode: data.episode
                            });
                        }
                    }
                }
                //Перейти к каталогу сериала
                re = /<div class="link_catalog">.+?"http:\/\/amovies.org(.+?)">(.+?)</;
                m = re.exec(v);
                if (m) {
                    page.appendItem(PREFIX + ":page:" + m[1], "directory", {
                        title: m[2]
                    });
                }
            }
            if (link.indexOf('/film/') != -1) {
                data.eng_title = md.title.split(' | ')[1];
                p('film' + '\n' + link);
                p(md.title);
                data.url = match(/<iframe src="http:\/\/vk.com\/([^"]+)/, post_full, 1)
                data.url = match(/(http:\/\/hdgo.cc[^"]+)/, post_full, 1)
                item = page.appendItem(PREFIX + ":play:" + escape(JSON.stringify(data)), "video", {
                    title: md.title,
                    season: +md.season,
                    year: md.year,
                    imdbid: md.imdbid,
                    icon: md.icon,
                    genre: md.genre,
                    duration: +md.duration,
                    rating: +md.rating * 10,
                    description: new showtime.RichText((md.status ? 'Статус: ' + md.status + '\n' : '') + (md.director ? 'Режиссер: ' + md.director + '\n' : '') + (md.actor ? 'Актеры: ' + md.actor + '\n' : '') + '\n' + md.description)
                });
                if (service.thetvdb) {
                    item.bindVideoMetadata({
                        title: md.title.split(' | ')[1],
                        year: md.year
                    });
                }
            }
            //http://amovies.org/eng
            if (link.indexOf('/eng/') != -1) {
                p('eng' + '\n' + link);
                re = /value=(?:"http:\/\/vk.com\/|"http:\/\/rutube.ru\/)([^"]+)">(\W+)([0-9]+(?:\.[0-9]*)?) сезон ([0-9]+(?:\.[0-9]*)?) серия/g;
                m = re.execAll(v);
                if (m.toString()) {
                    for (i = 0; i < m.length; i++) {
                        data.title = m[i][2].trim();
                        data.season = +m[i][3];
                        data.episode = +m[i][4];
                        data.url = m[i][1];
                        item = page.appendItem(PREFIX + ":play:" + escape(JSON.stringify(data)), "video", {
                            title: data.title + ' | ' + data.season + ' сезон ' + data.episode + ' серия'
                        });
                        if (service.thetvdb) {
                            item.bindVideoMetadata({
                                title: data.title,
                                season: data.season,
                                episode: data.episode
                            });
                        }
                    }
                }
            }
            p(md);
            p(data);
        } catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }


        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });
    // Play links
    plugin.addURI(PREFIX + ":play:(.*)", function(page, data) {
        page.loading = true;
        var canonicalUrl = PREFIX + ":play:" + (data);
        data = JSON.parse(unescape(data));
        p(data)
        if (data.season || data.episode) {
            title = data.title + " | " + data.season + " \u0441\u0435\u0437\u043e\u043d " + " | " + data.episode + " \u0441\u0435\u0440\u0438\u044f"
        } else title = data.title

            page.metadata.title = title
        var videoparams = {
            canonicalUrl: canonicalUrl,
            no_fs_scan: true,
            title: data.eng_title,
            year: data.year ? data.year : 0,
            season: data.season ? data.season : -1,
            episode: data.episode ? data.episode : -1,
            sources: [{
                    url: []
                }
            ],
            subtitles: []
        };


        p(data);
        if (/couber.be/.test(data.url)) {

            var v = http.request('http://' + data.url, {
                method: 'GET',
                headers: {
                    Referer: data.Referer

                }
            }).toString();
            //http:.*?hdgo.*?(?:mp4|\.flv)
            //http:.*?hdgo.*?(\d{3})-.*?flv

            p(v)
            regExp = /(http:.*?hdgo.*?(\d{3})-.*?flv)/g;
            while (((itemData = regExp.exec(v)) !== null) /*&& (i <= numItems)*/ ) {
                //print(itemData)
                p(videoparams)
                videoparams.sources = [{
                        url: itemData[1],
                        mimetype: 'video/x-flv'
                    }
                ]
                data.video_url = itemData[1]
                video = "videoparams:" + JSON.stringify(videoparams);
                page.appendItem(video, "video", {
                    title: '[' + itemData[2] + ']-' + title,
                    icon: /poster:"(.+?)"/.exec(v)[1]
                })
            }
        }
        if (data.url.indexOf('ideoapi.my.mail.ru') !== -1) {
            v = http.request('http://' + data.url);
            // var video_key = getCookie('video_key',v.multiheaders)
            //https://api.vk.com/method/video.getEmbed?oid=-86688251&video_id=170996975&embed_hash=1c63dad9f125d575&hd=2
            var json = JSON.parse(http.request(/metadataUrl":"([^"]+)/.exec(v)[1], {
                debug: service.debug,
                method: 'GET',
                headers: {
                    'User-Agent': USER_AGENT
                }
            }).toString());
            for (i in json.videos) {
                videoparams.sources = [{
                        url: json.videos[i].url,
                        mimetype: 'video/quicktime'
                    }
                ]
                data.video_url = json.videos[i].url
                videoparams.title = json.meta.title
                video = "videoparams:" + JSON.stringify(videoparams);
                page.appendItem(video, "video", {
                    title: '[' + json.videos[i].key + ']-' + json.meta.title,
                    duration: json.meta.duration,
                    icon: json.meta.poster
                })


            }
            //page.appendItem("search:" + data.title, "directory", {
            //    title: 'найти ' + data.title
            //});
            //page.type = "directory";
            //page.loading = false;
        }

        if (data.url.indexOf('oid=') !== -1) {

            vars = JSON.parse(http.request('https://api.vk.com/method/video.getEmbed?' + data.url.replace('&id', '&video_id').replace('&hash', '&embed_hash'), {
                debug: service.debug,
                method: 'GET',
                headers: {
                    'User-Agent': USER_AGENT
                }
            }).toString());
            p(vars)
            if (vars.error) {
                page.metadata.title = vars.error.error_msg
                popup.notify(vars.error.error_msg + '\n' + 'This video has been removed from public access.', 3)

            } else {
                for (key in vars.response) {
                    if (key == 'cache240' || key == 'cache360' || key == 'cache480' || key == 'cache720' || key == 'url240' || key == 'url360' || key == 'url480' || key == 'url720') {
                        videoparams.sources = [{
                                url: vars.response[key],
                                mimetype: "video/quicktime"
                            }
                        ]
                        video = "videoparams:" + JSON.stringify(videoparams)
                        page.appendItem(video, "video", {
                            title: "[" + key.match(/\d+/g) + "]-" + data.title + " | " + data.season + " \u0441\u0435\u0437\u043e\u043d  | " + data.episode + " \u0441\u0435\u0440\u0438\u044f",
                            duration: vars.response.duration,
                            icon: vars.response.thumb
                        });
                    }
                }
            }


            //page.appendItem("search:" + data.title, "directory", {
            //    title: 'найти ' + data.title
            //});
            //page.type = "directory";
            //page.loading = false;
        }

        if (data.url.indexOf('hdgo.cc') !== -1) {
            p(data.url)
            var v = http.request(data.url, {
                method: 'GET',
                headers: {
                    Referer: data.Referer

                }
            }).toString();
            p(v)
            video_url = /source src="(http.+\/)(.+?)\.mp4/.exec(v)
            //            function setHTML5 () {
            //$('#player-hd').html('<video controls autoplay width=100% height=100%><source src="http://server11.hdgo.cc/flv/9f382d73f27aacb231c5cb26b42ec05d/5ca24e0be2622243b6dcf25f95da0239.mp4" type="video/mp4; codecs="avc1.4D401E, mp4a.40.2""></video>');
            //	}
            //
            //function setPlayer () {
            //    if (is_html5()) {
            //        setHTML5();
            //    } else {
            //        setFlash('vCV82iob3gRLvcy43Ik43jEcv5hZkasBUatLk5Wav145t1DNkg31kjncUxFjUjn1txtzUanNy5nbt5wjtgwZv1wjUQnbkQuHkQnatjnNygyHy5ojkjnzkjZzkdEVtjtmv5k8GDrr');
            ////    }
            ////}
            //
            //            http: //server17.hdgo.cc/flv/9f382d73f27aacb231c5cb26b42ec05d/480-4fb3f9e2929074d52d35150af30a7f24.flv
            videoparams.sources = [{
                    url: video_url[1] + video_url[2] + '.mp4',
                    mimetype: "video/mp4"
                }
            ]
            video = "videoparams:" + JSON.stringify(videoparams)
            page.appendItem(video, "video", {
                title: "[MP4]-" + data.title
            });

            videoparams.sources = [{
                    url: video_url[1] + '720-' + video_url[2] + '.flv'
                }
            ]
            video = "videoparams:" + JSON.stringify(videoparams)
            page.appendItem(video, "video", {
                title: "[720]-" + data.title
            });
            videoparams.sources = [{
                    url: video_url[1] + '480-' + video_url[2] + '.flv'
                }
            ]
            video = "videoparams:" + JSON.stringify(videoparams)
            page.appendItem(video, "video", {
                title: "[480]-" + data.title
            });
            videoparams.sources = [{
                    url: video_url[1] + video_url[2] + '.flv'

                }
            ]
            video = "videoparams:" + JSON.stringify(videoparams)
            page.appendItem(video, "video", {
                title: "[360]-" + data.title
            });



        }


        page.appendItem("search:" + data.title, "directory", {
            title: 'найти ' + data.title
        });
        page.type = "directory";
        page.metadata.logo = logo;
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":video:(.*)", function(page, data) {
        p(PREFIX + ":play:" + (data))
        //data = JSON.parse(unescape(data));
        data = JSON.parse(unescape(data));
        page.loading = true;

        var videoparams = {
            canonicalUrl: '',
            no_fs_scan: true,
            title: data.eng_title,
            year: data.year ? data.year : 0,
            season: data.season ? data.season : -1,
            episode: data.episode ? data.episode : -1,
            sources: [{
                    url: data.video_url
                }
            ],
            subtitles: []
        };

        if (showtime.probe(data.video_url).result === 0) {
            data.video_url = undefined
            data = escape(JSON.stringify(data))
            videoparams.canonicalUrl = PREFIX + ":play:" + (data);
            p(videoparams.canonicalUrl)
            page.type = "video";
            page.source = "videoparams:" + JSON.stringify(videoparams)
        } else {
            popup.notify('video', 3);
        }
        page.metadata.logo = logo;
        page.loading = false;
    });
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            showtime.trace("Search aMovies Videos for: " + query);

            var v = http.request(BASE_URL + '/index.php?do=search', {
                debug: service.debug,
                headers: {
                    'User-Agent': USER_AGENT
                },
                postdata: {
                    do :'search',
                    subaction: 'search',
                    search_start: 1,
                    full_search: 0,
                    result_from: 1,
                    story: encodeURIComponent(showtime.entityDecode(query))
                }
            });
            var re = /fullresult_search[\S\s]+?date.+?>(.+?)<[\S\s]+?src="(.+?)"[\S\s]+?href="http:\/\/amovies.org(.+?)" >(.+?)<[\S\s]+?<span>(.*)<\//g;
            var m = re.execAll(v.toString());
            for (var i = 0; i < m.length; i++) {
                page.appendItem(PREFIX + ":page:" + m[i][3], "video", {
                    title: new showtime.RichText(m[i][4] + (m[i][5].length === 0 ? '' : ' | ' + m[i][5])),
                    icon: m[i][2],
                    description: new showtime.RichText(m[i][5] + '\n' + "Updated: " + m[i][1])
                });
                page.entries = i;
            }
        } catch (err) {
            showtime.trace('aMovies - Ошибка поиска: ' + err);
            e(err);
        }
    });





    //extra functions

    function MetaTag(dom, tag) {
        var meta = dom.root.getElementByTagName('meta')
        for (i in meta) {
            if (meta[i].attributes.getNamedItem('property') && meta[i].attributes.getNamedItem('property').value == tag) return meta[i].attributes.getNamedItem('content').value
        }
        return ''
    }

    function getIMDBid(title) {
        p(encodeURIComponent(showtime.entityDecode(unescape(title))).toString());
        var resp = http.request('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var re = /http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/;
        var imdbid = re.exec(resp);
        if (imdbid) imdbid = imdbid[1];
        else {
            re = /http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//;
            imdbid = re.exec(resp);
            if (imdbid) imdbid = imdbid[1];
        }
        return imdbid;
    }

    function get_fanart(title) {
        var v, id;
        title = trim(title);
        v = http.request('http://www.thetvdb.com/api/GetSeries.php', {
            'seriesname': title,
            'language': 'ru'
        }).toString();
        id = match(/<seriesid>(.+?)<\/seriesid>/, v, 1);
        if (id) {
            v = (http.request('http://www.thetvdb.com/api/0ADF8BA762FED295/series/' + id + '/banners.xml').toString());
            id = match(/<BannerPath>fanart\/original\/([^<]+)/, v, 1);
            return "http://thetvdb.com/banners/fanart/original/" + id;
        }
        return false;
    }
    // Add to RegExp prototype


    /*            RegExp.prototype.execAll = function (str) {
          //  var pattern = _globalize(this);
            var matches = [];
            var match;
            while ((match = this.exec(str)) !== null) {
                matches.push(match);
            }
            return matches.length ? matches : null;
        }
    /**/
    RegExp.prototype.execAll = function(str) {
        var match = null
        for (var matches = []; null !== (match = this.exec(str));) {
            var matchArray = [],
                i;
            for (i in match) {
                parseInt(i, 10) == i && matchArray.push(match[i]);
            }
            matches.push(matchArray);
        }
        if (this.exec(str) == null) return null
        return matches;
    }

    function match(c, a, b) {
        a = a.toString();
        b = "undefined" !== typeof b ? b : 0;
        return c.exec(a) ? c.exec(a)[b] : "";
    };

    function trim(s) {
        s = s.toString();
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }

    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }

    function p(message) {
        if (service.debug == '1') {
            print(message);
            if (typeof(message) === 'object') print(dump(message))
        }
    }

    function dump(arr, level) {
        var dumped_text = "";
        if (!level) level = 0;

        //The padding given at the beginning of the line.
        var level_padding = "";
        for (var j = 0; j < level + 1; j++) level_padding += "    ";

        if (typeof(arr) == 'object') { //Array/Hashes/Objects
            for (var item in arr) {
                var value = arr[item];

                if (typeof(value) == 'object') { //If it is an array,
                    dumped_text += level_padding + "'" + item + "' ...\n";
                    dumped_text += dump(value, level + 1);
                } else {
                    dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
                }
            }
        } else { //Stings/Chars/Numbers etc.

            dumped_text = arr;
        }
        return dumped_text;
    }

    function trace(msg) {
        if (service.debug == '1') {
            t(msg);
            p(msg);
        }
    }

    function getCookie(name, multiheaders) {
        var cookie = JSON.stringify(multiheaders['Set-Cookie']);
        p('cookie: ' + cookie);
        var matches = cookie.match(new RegExp('(?:^|; |","|")' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=' + decodeURIComponent(matches[1]) : false;
    }
    //time stuff



    function countDelay(delay, lastRequest) {
        p("Getting difference between:" + lastRequest + " and " + Date.now());
        var timeDiff = Date.now() - lastRequest;
        p("time sinse last call:" + timeDiff);
        return timeDiff < delay ? delay - timeDiff : 0;
    };

    function sleep(ms) {
        var last = Date.now();
        for (; !(Date.now() - last > ms);) {}
    };
})(this);