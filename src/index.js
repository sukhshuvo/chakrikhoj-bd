export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/jobs") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM jobs WHERE status = 'approved' ORDER BY created_at DESC"
      ).all();

      return Response.json(results);
    }

    return env.ASSETS.fetch(request);
  }
};
