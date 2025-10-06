function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     PRODUCT QUICK VIEW MODAL
  ============================ */
  const productModal = document.getElementById("quickViewModal");
  if (productModal) {
    const modalImg = document.getElementById("modal-img");
    const modalTitle = document.getElementById("modal-title");
    const modalDesc = document.getElementById("modal-desc");
    const modalPrice = document.getElementById("modal-price");
    const modalLink = document.getElementById("modal-link");
    const closeBtn = productModal.querySelector(".close");

    let images = [];
    let currentIndex = 0;

    // Show product modal
    document.querySelectorAll(".quick-view").forEach(button => {
      button.addEventListener("click", () => {
        modalTitle.textContent = button.dataset.title;
        modalDesc.textContent = button.dataset.desc;
        modalPrice.textContent = button.dataset.price;
        modalLink.href = button.dataset.link;

        // Multiple images
        images = button.dataset.images ? button.dataset.images.split(",") : [button.dataset.img];
        currentIndex = 0;
        modalImg.src = images[currentIndex];

        productModal.style.display = "flex";
      });
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
      productModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === productModal) {
        productModal.style.display = "none";
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
  }

  /* ============================
     INSIGHTS READ MORE MODAL
  ============================ */
  const insightModal = document.getElementById("insightModal");
  if (insightModal) {
    const insightImg = document.getElementById("modal-img");
    const insightTitle = document.getElementById("modal-title");
    const insightText = document.getElementById("modal-text");
    const closeInsightBtn = insightModal.querySelector(".close");

    document.querySelectorAll(".read-more").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        // Pull values from dataset
        insightTitle.textContent = link.dataset.title || "Insight";
        insightImg.src = link.dataset.img || "";
        // Allow multi-paragraphs using innerHTML
        insightText.innerHTML = link.dataset.text || "More details coming soon...";

        insightModal.style.display = "flex";
      });
    });

    // Close modal
    closeInsightBtn.addEventListener("click", () => {
      insightModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === insightModal) {
        insightModal.style.display = "none";
      }
    });
  }
});
