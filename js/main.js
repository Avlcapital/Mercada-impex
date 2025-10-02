function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("quickViewModal");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalPrice = document.getElementById("modal-price");
  const modalLink = document.getElementById("modal-link");
  const closeBtn = document.querySelector(".close");

  let images = [];
  let currentIndex = 0;

  // Show modal when clicking "View"
  document.querySelectorAll(".quick-view").forEach(button => {
    button.addEventListener("click", () => {
      modalTitle.textContent = button.dataset.title;
      modalDesc.textContent = button.dataset.desc;
      modalPrice.textContent = button.dataset.price;
      modalLink.href = button.dataset.link;

      // Load multiple images if provided
      images = button.dataset.images ? button.dataset.images.split(",") : [button.dataset.img];
      currentIndex = 0;
      modalImg.src = images[currentIndex];

      modal.style.display = "flex";
    });
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Slider controls
  document.querySelector(".prev").addEventListener("click", () => {
    if (images.length > 1) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      modalImg.src = images[currentIndex];
    }
  });

  document.querySelector(".next").addEventListener("click", () => {
    if (images.length > 1) {
      currentIndex = (currentIndex + 1) % images.length;
      modalImg.src = images[currentIndex];
    }
  });
});
