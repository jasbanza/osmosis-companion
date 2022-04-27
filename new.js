const NEW_SETTINGS = {
  "unix_expiry": 1649282400000
};
document.addEventListener('DOMContentLoaded', function() {
  if (Date.now() < NEW_SETTINGS.unix_expiry) {
    document.querySelectorAll(".new-indicator").forEach((item, i) => {
      item.classList.add("show");
    });
  }
});
