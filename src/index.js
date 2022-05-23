export default {
  async fetch(request, env) {
    const { ROOT_GH } = env;
    if (!ROOT_GH) {
      throw new Error('ROOT_GH is not defined');
    }

    const url = new URL(request.url);
    let { hostname, pathname, search } = url;

    // subdomain.domain.com (2 DOTS)
    // IF workers.dev, subdomain.[WORKER].[USERNAME].workers.dev (4 DOTS)
    const dotsCount = /workers\.dev/i.test(hostname) ? 4 : 2;
    const subdomain =
      (hostname.match(/\./g) || []).length === dotsCount &&
      hostname.split('.', 1);

    // domain.com/sub-dir
    if (pathname && pathname != '/' && /^\/[^/.]+$/.test(pathname)) {
      console.log(`301 Redirect for "${pathname}"`);
      return Response.redirect(url + '/', 301);
    }

    let ghURL;
    if (subdomain && pathname) {
      if (pathname === '/') {
        ghURL = `${ROOT_GH}/${subdomain}/${search}`;
      } else if (pathname.startsWith(`/${subdomain}/`)) {
        ghURL = `${ROOT_GH}${pathname}${search}`;
      } else {
        ghURL = `${ROOT_GH}/${subdomain}${pathname}${search}`;
      }
    } else {
      ghURL = `${ROOT_GH}${pathname}${search}`;
    }
    console.log(`${url} → ${ghURL}`);

    const response = await fetch(ghURL, {
      cf: {
        cacheEverything: true,
      },
    });
    const newResponse = new Response(response.body, response);
    newResponse.headers.append('x-origin-url', url);
    newResponse.headers.append('x-destination-url', ghURL);
    return newResponse;
  },
};
