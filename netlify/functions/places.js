exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-app-password",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  const senha = event.headers["x-app-password"];
  if (senha !== process.env.APP_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Não autorizado" }) };
  }
  const { segment, city } = JSON.parse(event.body || "{}");
  if (!segment || !city) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Parâmetros inválidos" }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;

  // Sem chave configurada
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "GOOGLE_PLACES_KEY não configurada no Netlify." }) };
  }

  const query = `${segment} em ${city} Brasil`;
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    // Repassa o status do Google para facilitar debug
    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Google Places retornou: ${searchData.status}. ${searchData.error_message || ""}`.trim()
        })
      };
    }

    if (!searchData.results || searchData.results.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
    }

    const places = await Promise.all(
      searchData.results.slice(0, 20).map(async (place) => {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&language=pt-BR&key=${apiKey}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const d = detailData.result || {};
        return {
          id: place.place_id,
          name: d.name || place.name,
          address: d.formatted_address || place.formatted_address,
          phone: d.formatted_phone_number || null,
          website: d.website || null,
          rating: d.rating || null,
          reviews: d.user_ratings_total || 0,
          hasWebsite: !!d.website,
          segment,
          city,
          status: "novo",
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: places }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
