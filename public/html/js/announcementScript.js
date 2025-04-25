function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    ;
    if (token) {
        $('#auth-buttons').hide();
        $('#user-menu').show();
    } else {
        $('#auth-buttons').show();
        $('#user-menu').hide();
    }
}

// Функция для выхода пользователя
async function logoutUser() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (response.status === 204) {
            localStorage.removeItem('authToken');
            checkAuthStatus();
            window.location.href = 'index.html';
        } else {
            console.error('Ошибка при выходе:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при выходе:', error);
    }
}

$(document).on('click', '#logout-btn', function(e) {
    e.preventDefault();
    logoutUser();
});

$(document).ready(function() {
    checkAuthStatus();
    // Получаем ID объявления из URL

    const currentUrl = window.location.href;

    // Создаем объект URL
    const url = new URL(currentUrl);

    // Используем URLSearchParams для извлечения параметра 'id'
    const announcementId = url.searchParams.get('id');
    
    // Загружаем данные объявления
    loadAnnouncement(announcementId);

    function loadAnnouncement(id) {
        $('#loading-announcement').show();
        $('#announcement-container').hide();
        $('#error-message').hide();

        $.ajax({
            url: `/Announcement/${id}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data) {
                    renderAnnouncement(data);
                    $('#loading-announcement').hide();
                    $('#announcement-container').show();
                } else {
                    showError();
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при загрузке объявления:', error);
                showError();
            }
        });
    }

    function renderAnnouncement(announcement) {
        // Устанавливаем заголовок страницы
        document.title = `RentHouse - ${announcement.title}`;

        // Заполняем основную информацию
        $('#announcement-title').text(announcement.title);
        $('#announcement-description').text(announcement.description || 'Описание отсутствует');
        $('#property-type').text(announcement.type === 'Квартира' ? 'Квартира' : 'Дом');
        $('#property-address').text(announcement.address);
        $('#property-area').text(announcement.area);
        $('#property-rooms').text(getRoomText(announcement.rooms));
        $('#property-date').text(new Date(announcement.created_at).toLocaleDateString());
        $('#property-price').text(`${formatPrice(announcement.price)} ₽/мес`);

        // Заполняем галерею фотографий
        const carouselInner = $('#carousel-inner');
        carouselInner.empty();

        if (announcement.announcement_photo && announcement.announcement_photo.length > 0) {
            announcement.announcement_photo.forEach((photo, index) => {
                const activeClass = index === 0 ? 'active' : '';
                carouselInner.append(`
                    <div class="carousel-item ${activeClass} property-img-container">
                        <img src="/storage/announcement/${photo.file_name}" class="d-block w-100 property-img" alt="Фото объекта">
                    </div>
                `);
            });
        } else {
            carouselInner.append(`
                <div class="carousel-item active">
                    <div class="d-flex align-items-center justify-content-center bg-light" style="height: 400px;">
                        <p class="text-muted">Нет фотографий</p>
                    </div>
                </div>
            `);
        }
    }

    function showError() {
        $('#loading-announcement').hide();
        $('#error-message').show();
    }

    function getRoomText(count) {
        if (count % 100 >= 11 && count % 100 <= 14) {
            return `${count} комнат`;
        }
        switch(count % 10) {
            case 1: return `${count} комната`;
            case 2:
            case 3:
            case 4: return `${count} комнаты`;
            default: return `${count} комнат`;
        }
    }

    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});