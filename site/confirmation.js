// This page never exchanges, stores, displays or transmits authentication credentials.
// Email verification happens at Supabase before this redirect. Sign in within the app.
(() => {
  const failed = new URLSearchParams(location.search).has('error') || new URLSearchParams(location.hash.slice(1)).has('error');
  history.replaceState(null, '', location.pathname);
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('failure').hidden = !failed;
  });
})();
