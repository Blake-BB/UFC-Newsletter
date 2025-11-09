let allNews = [];

async function fetchNews() {
  console.log("Fetching latest MMA news with fighter thumbnails...");

  const proxy = "https://corsproxy.io/?";

  const feeds = [
    "https://www.sherdog.com/rss/news",
    "https://www.mmamania.com/rss/current",
    "https://mmajunkie.usatoday.com/feed",
    "https://www.bjpenn.com/feed",
    "https://www.bloodyelbow.com/rss",
    "https://www.onefc.com/feed/"
  ];

  const newArticles = [];

  for (const url of feeds) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url));
      if (!response.ok) continue;

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");

      if (doc.querySelector("parsererror")) continue;

      const items = doc.querySelectorAll("item");
      items.forEach(item => {
        const title = item.querySelector("title")?.textContent || "No title";
        const link = item.querySelector("link")?.textContent || "#";
        const rawDesc = item.querySelector("description")?.textContent || "";
        const cleanDesc = rawDesc.replace(/<[^>]*>/g, "").trim();

        // BETTER IMAGE DETECTION — grabs fighter photos, event posters, etc.
        const imageMatch = rawDesc.match(/src=["'](https?:\/\/[^"']+\.(jpg|png|jpeg|webp))["']/i);
        let image = imageMatch ? imageMatch[1] : "";

        // FALLBACK: Use UFC/Tapology style images from title
        if (!image) {
          const fighterName = title.match(/(Conor McGregor|Jon Jones|Dana White|Islam Makhachev|Alex Pereira|Sean O'Malley|Ilia Topuria)/i);
          if (fighterName) {
            const name = fighterName[0].toLowerCase().replace(/\s+/g, '-');
            image = `https://dmxg5wxfqgbkd.cloudfront.net/s3fs-public/styles/news_teaser/public/2024-10/${name}.jpg`;
          }
        }

        const pubDate = item.querySelector("pubDate")?.textContent || "";
        const date = pubDate ? new Date(pubDate).toLocaleDateString() : "Today";
        const source = new URL(url).hostname.replace("www.", "").split(".")[0].toUpperCase();

        newArticles.push({ title, link, description: cleanDesc, date, source, image });
      });
    } catch (e) {
      // silent
    }
  }

  allNews = [...newArticles, ...allNews.filter(old => 
    !newArticles.some(n => n.link === old.link)
  )].slice(0, 100);

  renderNews(allNews);
}

function searchNews() {
  const query = document.getElementById("search-bar").value.toLowerCase().trim();
  if (!query) {
    renderNews(allNews);
    return;
  }
  const filtered = allNews.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.description.toLowerCase().includes(query) ||
    item.source.toLowerCase().includes(query)
  );
  renderNews(filtered);
}

function renderNews(news) {
  const container = document.getElementById('news-feed');
  if (news.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#aaa; padding:5rem;">No articles found. Try another search!</p>`;
    return;
  }

  container.innerHTML = news.map(item => `
    <div class="news-card" onclick="window.open('${item.link}', '_blank')">
      ${item.image ? `<img src="${item.image}" alt="${item.title}" class="thumb" loading="lazy">` : ''}
      <h3>
        <a href="${item.link}" target="_blank" rel="noopener" onclick="event.stopPropagation();">
          ${item.title}
        </a>
      </h3>
      <p class="preview">
        ${item.description.substring(0, 130)}${item.description.length > 130 ? '...' : ''}
      </p>
      <div class="meta">
        <span class="source">${item.source}</span>
        <span class="date">${item.date}</span>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchNews();
  setInterval(fetchNews, 5 * 60 * 1000);
});
