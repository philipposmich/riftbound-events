export default {
  async fetch(request, env, ctx) {
    return new Response("Riftbound Events is online!", {
      headers: {
        "content-type": "text/plain; charset=UTF-8",
      },
    });
  },
};
