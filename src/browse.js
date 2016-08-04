data = {}

function ScrapeList(href, pageHtml) {
  var returnValue = []
  var dle_content = pageHtml.dom.getElementById('dle-content');
  //list
  var elements = dle_content.getElementByClassName('short-film')
  for (i = 0; i < elements.length; i++) {
    element = elements[i]
    returnValue.push({
      url: element.getElementByTagName("a")[0].attributes.getNamedItem('href').value.match(/http:\/\/amovies.org(.*)/)[1],
      tag: '',
      title: element.getElementByClassName("film-name")[0].textContent,
      image: BASE_URL + element.getElementByTagName("img")[0].attributes.getNamedItem('src').value,
      description: element.getElementByClassName("film-date-t")[0].textContent,
    })
  }
  //search list
  log.p(dle_content.getElementByClassName('res-search').length)
  log.p(pageHtml.dom.getElementByClassName('res-search')!== null)
  var elements = dle_content.getElementByClassName('res-search').length ? dle_content.getElementByClassName('res-search')[0].children :''
  for (i = 0; i < elements.length; i++) {
    element = elements[i]
    returnValue.push({
      url: element.getElementByTagName("a")[0].attributes.getNamedItem('href').value.match(/http:\/\/amovies.org(.*)/)[1],
      tag: '',
      title: element.getElementByTagName("img")[0].attributes.getNamedItem('alt').value,
      image: element.getElementByTagName("img")[0].attributes.getNamedItem('src').value,
      //description: element.getElementByClassName("film-date-t")[0].textContent,
    })
  }

  returnValue.endOfData = pageHtml.dom.getElementByClassName('navigation').length ? pageHtml.dom.getElementByClassName('navigation')[0].children[pageHtml.dom.getElementByClassName('navigation')[0].children.length - 1].nodeName == 'span' : true
  return returnValue
}

function ScrapePage(page, href, pageHtml) {
  log.p(pageHtml.text.toString())

  data.title = pageHtml.dom.getElementByTagName('h1')[0].textContent.replace('онлайн', '')
  data.second_name = pageHtml.dom.getElementByClassName('second-name')[0].textContent
  data.poster = BASE_URL + pageHtml.dom.getElementByClassName('poster')[0].getElementByTagName('img')[0].attributes.getNamedItem('src').value
  //data.desctiption = pageHtml.dom.getElementByClassName('film-block')[0].getElementByClassName('film-description')[0].textContent


  page.metadata.title = data.title;

  if (pageHtml.dom.getElementByClassName('film-block') !== null) {
    var iFrame = pageHtml.dom.getElementByClassName('film-block')[0].getElementByTagName('iframe')[0].attributes.getNamedItem('src').value
  }
  data.poster = BASE_URL + pageHtml.dom.getElementByClassName('poster')[0].getElementByTagName('img')[0].attributes.getNamedItem('src').value
  sss = ({
    Referer: BASE_URL + href,
    title: data.title.trim()
  })

  log.p(iFrame)
  if (/couber.be\/video\/serials\/pl\/sound\//.test(iFrame)) {
    log.p('serial')
    var v = http.request(iFrame, {
      debug: service.debug,
      method: 'GET',
      headers: {
        'User-Agent': UA,
        Referer: BASE_URL + href
      }
    }).toString();
    log.p(v)
    eval(v.match(/uvk.show.[\s\S]+uvk.(show\([^)]+.)/)[1])
  }
  if (/couber.be\/video\/t\/.*\/\d+\//.test(iFrame)) {
    log.p('iFrame')
    data.url = iFrame.toString();
    page.appendItem(PREFIX + ":play:" + JSON.stringify(data), "video", {
      title: data.title,
      icon: data.poster,
    })
  }

  function show(a, b) {
    for (var i = 0; i < a.length; i++) {
      page.appendItem("", "separator", {
        title: a[i]
      });
      //sss.perevod[i] = {title: a[i]};
      sss[i] = [{
          title: a[i]
        }
      ]

      for (var j = 0; j < b[i].length; j++) {
        data.url = b[i][j]
        data.title = (j + 1) + " серия"
        page.appendItem(PREFIX + ":play:" + JSON.stringify(data), "video", {
          title: data.title,
          icon: data.poster,
        })

        sss[i].push({
          Perevod2: a[i],
          url: b[i][j],
          episode: (j + 1)
        })

      }
    }
    log.p(sss)
  }
}


function populateItemsFromList(page, list) {
  log.p({function:'populateItemsFromList',list:list})
  for (i = 0; i < list.length; i++) {
    page.appendItem(PREFIX + ":page:" + (list[i].url), "video", {
      title: list[i].title,
      description: list[i].description,
      icon: list[i].image
    })
    page.entries++;
  }
}

exports.search = function(page,query){
  page.loading = true;
  page.type = 'directory';
  page.entries = 0;
  log.p({title:'exports.search',params:query})
          //try {
            log.d("Search aMovies Videos for: " + query);

            var v = http.request(BASE_URL + '/index.php?do=search', {
                debug: 1,//service.debug,
                headers: {
                    'User-Agent': UA
                },
                postdata: {
                    do :'search',
                    subaction: 'search',
                    search_start: 1,
                    full_search: 0,
                    result_from: 1,
                    story: encodeURIComponent(query)
                }
            });

            pageHtml = {text:v, dom: html.parse(v).root}

            list = ScrapeList('',pageHtml)

            populateItemsFromList(page, list);
        //} catch (err) {
           // log.d('aMovies - Ошибка поиска: ' + err);
            //log.e(err);
        //}
        page.loading = false;
}
exports.list = function(page, params) {
  page.loading = true;
  page.type = 'directory';
  page.model.contents = 'grid';
  page.entries = 0;
  log.p('exports.list')
  log.p(params)
  log.p(params.args)
  var nextPage = 1

    function loader() {
      url = params.page ? params.href + params.page : params.href + 'page/1/'
      api.call(page, url, null, function(pageHtml) {

        list = ScrapeList(url, pageHtml)
        populateItemsFromList(page, list);
        nextPage++
        params.page = 'page/' + nextPage + '/'

        page.haveMore(list.endOfData !== undefined && !list.endOfData);
      });
    }

  loader();
  page.asyncPaginator = loader;
}

exports.moviepage = function(page, href) {
  page.loading = true;
  page.type = 'directory';
  url = href;
  api.call(page, url, null, function(pageHtml) {
    ScrapePage(page, url, pageHtml)
  });
  page.loading = false;
}

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