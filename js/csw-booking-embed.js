(() => {
  const config = window.CSW_BOOKING;
  const frame = document.getElementById('csw-booking');
  if (!frame || !config) return;
  const date = new URLSearchParams(location.search).get('date') || '';
  const embedId = crypto.randomUUID();
  const query = '?embedId=' + embedId + (/^\d{4}-\d{2}-\d{2}$/.test(date) ? '&date=' + date : '');
  const live = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.webAppUrl);
  frame.src = (live ? config.webAppUrl : '../booking/Widget.html') + query;
  const fallback = document.getElementById('csw-open-form');
  fallback.href = frame.src;
  fallback.textContent = live ? 'Open signup in a separate tab' : 'Open signup preview in a separate tab';
  document.getElementById('csw-setup-notice').hidden = live;
  window.addEventListener('message', event => {
    const trustedOrigin = live ? /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin) : event.origin === location.origin;
    if (!trustedOrigin || !event.data || event.data.type !== 'csw:resize' || event.data.embedId !== embedId) return;
    const height = Number(event.data.height);
    if (Number.isFinite(height)) frame.style.height = Math.min(5000, Math.max(600, height)) + 'px';
  });
  if (date) frame.addEventListener('load', () => frame.scrollIntoView({behavior: 'smooth', block: 'start'}), {once: true});
})();
