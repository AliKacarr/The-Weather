
function openMenu() {
    document.getElementById("sideMenu").style.width = "250px";
    document.getElementById("sideMenu").style.display="block";
    document.querySelector(".menu-toggle").style.display = "none"; // Açma butonunu gizle
    const menuToggle = document.querySelector(".menu-toggle");
    menuToggle.classList.add("hidden"); // Açma butonunu gizle
  }
  
  function closeMenu() {
    document.getElementById("sideMenu").style.width = "0";
    document.querySelector(".menu-toggle").style.display = "block"; // Açma butonunu göster
    setTimeout(() => {
        const menuToggle = document.querySelector(".menu-toggle");
        menuToggle.classList.remove("hidden"); // Açma butonunu yavaşça göster
    }, 600);
  }
  
  