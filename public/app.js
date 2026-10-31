(() => {
  const heroes = document.getElementById('heroes');
  const cost = document.getElementById('cost');
  const result = document.getElementById('result');
  const wholeNumber = input => Math.min(Number(input.max), Math.max(0, Math.floor(Number(input.value) || 0)));
  const update = () => {
    const total = wholeNumber(heroes) * 20 - wholeNumber(cost);
    result.textContent = `${new Intl.NumberFormat('vi-VN').format(total)} Ruby`;
  };
  heroes.addEventListener('input', update);
  cost.addEventListener('input', update);
  update();

  const dialog = document.getElementById('image-dialog');
  const dialogImage = document.getElementById('dialog-image');
  document.querySelectorAll('.image-button').forEach(button => button.addEventListener('click', () => {
    dialogImage.src = button.dataset.image;
    dialogImage.alt = button.dataset.alt;
    dialog.showModal();
  }));
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
