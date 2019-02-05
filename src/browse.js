data = {};

function ScrapeList(href, pageHtml) {
	var returnValue = [];
	var dle_content = pageHtml.dom.getElementById('dle-content');
	log.d(pageHtml.text.toString());
	var elements = dle_content.getElementByClassName('short-film');
	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		returnValue.push({
			url: element.getElementByTagName('a')[0].attributes.getNamedItem('href').value.match(/http:.*amovies.*?(\/.*)/)[1],
			tag: '',
			title: element.getElementByClassName('film-name')[0].textContent,
			image: BASE_URL + element.getElementByTagName('img')[0].attributes.getNamedItem('src').value,
			description: element.getElementByClassName('film-date-t')[0].textContent
		});
	}
	//search list
	log.p(dle_content.getElementByClassName('res-search').length);
	log.p(pageHtml.dom.getElementByClassName('res-search') !== null);
	var elements = dle_content.getElementByClassName('res-search').length ? dle_content.getElementByClassName('res-search')[0].children : '';
	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		returnValue.push({
			url: element.getElementByTagName('a')[0].attributes.getNamedItem('href').value.match(/http:.*amovies.*?(\/.*)/)[1],
			tag: '',
			title: element.getElementByTagName('img')[0].attributes.getNamedItem('alt').value,
			image: element.getElementByTagName('img')[0].attributes.getNamedItem('src').value
			//description: element.getElementByClassName("film-date-t")[0].textContent,
		});
	}
	//endOfData = document.getElementsByClassName('navigation').length ? document.getElementsByClassName('navigation')[0].children[document.getElementsByClassName('navigation')[0].children.length - 1].nodeName !== 'A' : true
	returnValue.endOfData = pageHtml.dom.getElementByClassName('navigation').length ? pageHtml.dom.getElementByClassName('navigation')[0].children[pageHtml.dom.getElementByClassName('navigation')[0].children.length - 1].nodeName !== 'a' : true;
	return returnValue;
}

function ScrapeiFrame(page, href, pageHtml) {
	try {
		log.d(data);
		log.p(pageHtml.text.toString());
		var match = /src=\"(.*?video\/[a-z]+\/[a-zA-Z0-9_\-]+\/\d+\/)/.exec(pageHtml.text.toString());
		data.url = null != match ? match[1] : '';
		log.d('data.url: ' + data.url);
		var sss = [];
		if (/\/video\/t\/.*\/\d+\//.test(data.iFrame)) {
			data.url = data.iFrame;
			page.appendItem(PREFIX + ':play:' + JSON.stringify(data), 'video', {
				title: data.title,
				icon: data.poster
			});
		} else eval((pageHtml.text.toString().match(/uvk.(show\([^)]+.)/) || [])[1]);

		function show(a, b) {
			for (var i = 0; i < a.length; i++) {
				page.appendItem('', 'separator', {
					title: a[i]
				});
				sss[i] = [{
					title: a[i]
				}];
				for (var j = 0; j < b[i].length; j++) {
					data.url = data.iFrame.match(/http.*\/\/[^\/]+/)[0] + b[i][j].match(/\/video\/t.*/)[0];
					data.title = j + 1 + ' серия';
					page.appendItem(PREFIX + ':play:' + JSON.stringify(data), 'video', {
						title: data.title,
						icon: data.poster
					});
					sss[i].push({
						url: b[i][j],
						episode: j + 1
					});
				}
			}
			//log.d(sss)
		}
	} catch (err) {
		log.e(err.stack);
	}
}

function ScrapePage(page, href, pageHtml) {
	var match = /src=\\"(.*?video\/[a-z]+\/[a-zA-Z0-9_\-]+\/\d+\/)/.exec(pageHtml.text);
	data.url = null != match ? match[1] : '';
	log.d(data.url);
	data.title = pageHtml.dom.getElementByTagName('h1')[0].textContent.replace('онлайн', '');
	data.second_name = pageHtml.dom.getElementByClassName('second-name').length ? pageHtml.dom.getElementByClassName('second-name')[0].textContent : '';
	data.poster = BASE_URL + pageHtml.dom.getElementByClassName('poster')[0].getElementByTagName('img')[0].attributes.getNamedItem('src').value;
	//data.desctiption = pageHtml.dom.getElementByClassName('film-block')[0].getElementByClassName('film-description')[0].textContent
	//torrents
	if ((torrents = pageHtml.dom.getElementById('download'))) {
		var elements = torrents.children[0].children;
		for (i = 0; i < elements.length; i++) {
			element = elements[i];
			page.appendItem('', 'separator', {
				title: clearTitle(element.children[0].textContent)
			});
			element.children[1].children.forEach(function(element, i) {
				page.appendItem('torrent:browse:' + element.getElementByTagName('a')[0].attributes.getNamedItem('href').value, 'video', {
					title: clearTitle(element.textContent),
					icon: data.poster
				});
			});
		}
	}
	page.metadata.title = data.title;
	if (pageHtml.dom.getElementByClassName('film-block') !== null) {
		data.iFrame = pageHtml.dom.getElementByClassName('film-block')[0].getElementByTagName('iframe')[0].attributes.getNamedItem('src').value;
		//data.iFrame = data.iFrame.replace(/http:\/\/.*?\//, "http://go.6z6w7d0z07e.ru/")
	}
	log.d(pageHtml.dom.getElementByClassName('film-block') && !pageHtml.dom.getElementByTagName('option').length);
	var elements = pageHtml.dom.getElementByTagName('option');
	for (i = 0; i < elements.length; i++) {
		element = elements[i];
		data.url = element.attributes.getNamedItem('value').value; //.replace(/http:\/\/.*?\//, "http://go.6z6w7d0z07e.ru/")
		data.title = element.textContent;
		page.appendItem(PREFIX + ':play:' + JSON.stringify(data), 'video', {
			title: element.textContent,
			icon: data.poster
		});
  }
  log.d('ScrapePage is done');
}

function populateItemsFromList(page, list) {
	log.p({
		function: 'populateItemsFromList',
		list: list
	});
	for (i = 0; i < list.length; i++) {
		page.appendItem(PREFIX + ':moviepage:' + list[i].url, 'video', {
			title: list[i].title,
			description: list[i].description,
			icon: list[i].image
		});
		page.entries++;
	}
}
exports.search = function(page, query) {
	page.loading = true;
	page.type = 'directory';
	page.entries = 0;
	log.p({
		title: 'exports.search',
		params: query
	});
	//try {
	log.d('Search aMovies Videos for: ' + query);
	var v = http.request(BASE_URL + '/index.php?do=search', {
		debug: 1, //service.debug,
		headers: {
			'User-Agent': UA
		},
		postdata: {
			do: 'search',
			subaction: 'search',
			search_start: 1,
			full_search: 0,
			result_from: 1,
			story: encodeURIComponent(query)
		}
	});
	pageHtml = {
		text: v,
		dom: html.parse(v).root
	};
	list = ScrapeList('', pageHtml);
	populateItemsFromList(page, list);
	page.loading = false;
};
exports.list = function(page, params) {
	page.loading = true;
	page.type = 'directory';
	page.entries = 0;
	log.d('exports.list');
	log.d(params);
	log.d(params.args);
	var nextPage = 1;

	function loader() {
		url = params.page ? params.href + params.page : params.href + 'page/1/';
		log.d('url=' + url);
		api.call(page, BASE_URL + url, null, function(pageHtml) {
			list = ScrapeList(url, pageHtml);
			populateItemsFromList(page, list);
			nextPage++;
			params.page = 'page/' + nextPage + '/';
			page.haveMore(list.endOfData !== undefined && !list.endOfData);
		});
	}
	loader();
	page.asyncPaginator = loader;
};
exports.moviepage = function(page, href) {
	page.loading = true;
	page.type = 'directory';
	url = BASE_URL + href;
	api.call(page, url, null, function(pageHtml) {
		ScrapePage(page, url, pageHtml);
		log.d(data);
		//iframe ?
		if (pageHtml.dom.getElementByClassName('film-block') && !pageHtml.dom.getElementByTagName('option').length) {
			api.call(page, data.iFrame, null, function(pageHtml) {
				if (pageHtml.dom.getElementByTagName('iframe')) {
					data.iFrame = 'http://' + pageHtml.dom.getElementByTagName('iframe')[0].attributes.getNamedItem('src').value.match(/\/\/(.*)/)[1];
					api.call(page, data.iFrame, null, function(pageHtml) {
						ScrapeiFrame(page, url, pageHtml);
					});
				}
			});
		}
	});
	page.loading = false;
};
//
function getProperty(item, className) {
	var prop = item.getElementByClassName(className);
	if (!prop.length) {
		return '';
	}
	prop = prop[0].textContent;
	if (prop) {
		return prop.trim();
	}
	return '';
}

function clearTitle(str) {
	str = str.toString();
	str = str.replace('серияHD', 'серия HD');
	str = str.replace(/(HD 720)/g, '$1 ');
	str = str.replace(/(HD 1080)/g, '$1 ');
	str = str.replace(/(HD 1080)/g, '$1 ');
	str = str.replace(' 1 серии', ' 1 серия ');
	str = str.replace('серии', 'серии ');
	str = str.replace('Скачать', 'Torrent');
	log.d(str);
	return str;
}