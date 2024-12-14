// Tüm butonları seç
const buttons = document.querySelectorAll('.btn');

// Her butona tıklama olayı ekle
buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
        // Önce diğer butonlardan 'active' sınıfını kaldır
        buttons.forEach(btn => btn.classList.remove('active'));
        // Tıklanan butona 'active' sınıfını ekle
        button.classList.add('active');

        // Sayfayı yenile ve parametre gönder
        const params = new URLSearchParams();
        params.append('day', index); // 0: Bugün, 1: Yarın, 2: 2 Gün Sonra
        window.location.href = `${window.location.pathname}?${params.toString()}`;
    });
});

// URL'deki seçili günü kontrol et ve aktif yap
const urlParams = new URLSearchParams(window.location.search);
const selectedDay = urlParams.get('day');
if (selectedDay !== null && buttons[selectedDay]) {
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[selectedDay].classList.add('active');
}