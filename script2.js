
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
  
  document.addEventListener("DOMContentLoaded", () => {
    // localStorage'daki tüm bilgileri temizle
    localStorage.clear();
  });
  
  // Dillerin ve metinlerin yer değiştirilmesi
  $('#swapLanguages').click(function () {
    const sourceLang = $('#sourceLanguage').val();
    const targetLang = $('#targetLanguage').val();
    const sourceText = $('#sourceText').val();
  
    // Dilleri değiştir
    $('#sourceLanguage').val(targetLang);
    $('#targetLanguage').val(sourceLang);
  
    // Çeviriyi yeniden başlat
    $('#sourceText').val($('#resultText').val());
    translate();
  });
  
  // Dil değiştiğinde çeviriyi yeniden yap
  function handleLanguageChange() {
    translate();
  }
  
  // Çeviri işlemi
  $('#sourceText').on('input', function () {
    translate();
  });
  
  // Silme butonuna tıklama işlevi
  $('.delete-icon').click(function () {
    $('#sourceText').val(''); // Kaynak metni temizle
    $('#resultText').val(''); // Çeviri metnini temizle
  });
  
  function translate() {
    const sourceText = $('#sourceText').val();
    const sourceLang = $('#sourceLanguage').val();
    const targetLang = $('#targetLanguage').val();
  
    if (!sourceText.trim()) {
        $('#resultText').val('');
        return;
    }
  
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(sourceText)}`;
    
    $.getJSON(url, function (data) {
        $('#resultText').val(data[0][0][0]);
    }).fail(function () {
        $('#resultText').val('Çeviri yapılamadı.');
    });
  }
  // Çeviri sonucunu panoya kopyala
  $('#resultContainer .icon-row2 img[src="images/paste1.png"]').click(function () {
    const resultText = $('#resultText').val();
    if (resultText.trim()) {
        navigator.clipboard.writeText(resultText).then(() => {
        }).catch(() => {
            alert('Panoya kopyalama başarısız oldu.');
        });
    } else {
        alert('Kopyalanacak metin bulunamadı.');
    }
  });
  
  // sourceText'i seslendir (Google Translate TTS)
  $('#sourceContainer .icon-row1 img[src="images/volume.png"]').click(function () {
    const text = $('#sourceText').val();
    if (text.trim()) {
        playTTS(text, $('#sourceLanguage').val());
    } else {
        alert('Seslendirilecek bir metin bulunamadı.');
    }
  });
  
  // resultText'i seslendir (Google Translate TTS)
  $('#resultContainer .icon-row2 img[src="images/volume.png"]').click(function () {
    const text = $('#resultText').val();
    if (text.trim()) {
        playTTS(text, $('#targetLanguage').val());
    } else {
        alert('Seslendirilecek bir metin bulunamadı.');
    }
  });
  
  // Google Translate TTS Oynatma Fonksiyonu
  function playTTS(text, lang) {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=gtx&q=${encodeURIComponent(text)}`;
    const audio = new Audio(ttsUrl);
    audio.play().catch(() => {
        alert('Seslendirme başlatılamadı.');
    });
  }
  
  
  // Yıldız simgesini değiştirme fonksiyonu
  function resetStarIcon() {
    const starIcon = $('.star-icon');
    if (starIcon.attr('src') === 'images/doluyıldız.png') {
        starIcon.attr('src', 'images/bosyıldız.png'); // Bosyıldız.png'ye döndür
    }
  }
  
  // Yıldız simgesi tıklama olayları
  $('.star-icon').click(function () {
    const starIcon = $(this);
    if (starIcon.attr('src') === 'images/bosyıldız.png') {
        starIcon.attr('src', 'images/doluyıldız.png'); // Doluyıldız.png yap
    } else {
        starIcon.attr('src', 'images/bosyıldız.png'); // Bosyıldız.png yap
    }
  });
  
  // ComboBox değiştirildiğinde yıldız sıfırla
  $('#sourceLanguage, #targetLanguage').change(function () {
    resetStarIcon();
  });
  
  // Arrow ile dil değiştirildiğinde yıldız sıfırla
  $('#swapLanguages').click(function () {
    resetStarIcon();
  });
  
  // Silme butonuna tıklanınca yıldız sıfırla
  $('.delete-icon').click(function () {
    resetStarIcon();
  });
  
  // Yazı alanına yeni metin girildiğinde yıldız sıfırla
  $('#sourceText').on('input', function () {
    resetStarIcon();
  });
  
  
  function openPopup(id) {
    document.getElementById(id).style.display = 'flex';
  
    // Metin kutularını temizle
    if (id === 'girisPopup') {
        document.getElementById("email").value = ""; // Giriş için eposta
        document.getElementById("password").value = ""; // Giriş için şifre
    } else if (id === 'kayitPopup') {
        document.getElementById("newUsername").value = ""; // Kayıt için kullanıcı adı
        document.getElementById("newEmail").value = ""; // Kayıt için eposta
        document.getElementById("newPassword").value = ""; // Kayıt için şifre
    }
  }
  
  function closePopup(id) {
    document.getElementById(id).style.display = 'none';
  }
  
  
  document.getElementById("savedIcon").addEventListener("click", () => {
    window.location.href = "saved.html";
  });
  
  
  
  
  
  function submitLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Giriş başarılı!") {
                // Kullanıcı e-postasını localStorage'a kaydet
                localStorage.setItem("userEmail", email);
  
                alert(data.message);
                closePopup("girisPopup");
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error("Hata:", error);
        });
  }
  
  
  function submitRegistration() {
    const name = document.getElementById("newUsername").value;
    const email = document.getElementById("newEmail").value;
    const password = document.getElementById("newPassword").value;
  
    fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === "Kayıt başarılı!") {
                 // Kullanıcı e-postasını localStorage'a kaydet
                localStorage.setItem("userEmail", email);
                alert(data.message);
                closePopup("kayitPopup");
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error("Hata:", error);
        });
  }
  
  
  
  
  
/*------------------------------------------------ */





