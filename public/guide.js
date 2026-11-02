(() => {
  const dialog = document.getElementById('image-dialog');
  const image = document.getElementById('dialog-image');
  if (!dialog || !image) return;
  document.querySelectorAll('.image-button').forEach(button => button.addEventListener('click', () => {
    image.src = button.dataset.image;
    image.alt = button.dataset.alt || '';
    dialog.showModal();
  }));
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
