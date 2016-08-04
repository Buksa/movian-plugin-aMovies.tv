exports.call = function(page, href, args, callback) {

  var URL = BASE_URL + href || '';
  var opts = {
    method: 'GET',
    headers: {
      'User-Agent': UA
    },
    args: [args || {}],
    debug: service.debug,
    noFail: true, // Don't throw on HTTP errors (400- status code)
    compression: true, // Will send 'Accept-Encoding: gzip' in request
    caching: true, // Enables Movian's built-in HTTP cache
  };

  log.p(URL)
  log.p(opts)

  http.request(URL, opts, function(err, result) {
    if (page) page.loading = false;
    if (err) {
      if (page) page.error(err);
      else console.error(err);
    } else {
      try {
        var pageHtml = {text:result, dom: html.parse(result).root};
        callback(pageHtml);
      } catch (e) {
        if (page) page.error(e);
        throw (e);
      }
    }
  });
}