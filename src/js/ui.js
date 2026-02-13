const btn = document.querySelector(".menu-toggle");
const menu = document.querySelector("nav ul");
const items = document.querySelectorAll("nav li");

btn.addEventListener("click", () => {
  btn.classList.toggle("active");
  menu.classList.toggle("active");

  items.forEach((item) => {
    item.classList.toggle("active");
  });
});