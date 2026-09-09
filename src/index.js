export default {
  async fetch(request, env, ctx) {
    const html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riftbound Events Greece</title>
</head>
<body>
  <h1>Riftbound Events Greece</h1>
  <p>Η σελίδα λειτουργεί κανονικά.</p>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    });
  },
};
