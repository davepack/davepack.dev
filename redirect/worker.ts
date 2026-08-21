// Permanent redirect: davepack.com (+ www) -> davepack.dev
export default {
  fetch(request: Request): Response {
    let url = new URL(request.url)

    return new Response(null, {
      status: 301,
      headers: {
        Location: `https://davepack.dev${url.pathname}${url.search}`,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    })
  },
}
