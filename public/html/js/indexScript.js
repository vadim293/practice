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

// Обработчик кнопки выхода
$(document).on('click', '#logout-btn', function(e) {
    e.preventDefault();
    logoutUser();
});

$(document).ready(function() {
    checkAuthStatus();
    // Показываем индикатор загрузки
    $('#loading-announcements').show();
    $('#announcements-container').hide();
    
    // Загружаем объявления из API
    $.ajax({
        url: '/Announcement',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            // Берем только 3 последних объявления
            const recentAnnouncements = data.slice(-3);
            
            // Очищаем контейнер
            $('#announcements-container').empty();
            
            // Добавляем каждое объявление в контейнер
            recentAnnouncements.forEach(function(announcement) {
                const cardHtml = `
                <div class="col-md-6 col-lg-4">
                    <div class="card property-card h-100">
                        ${announcement.announcement_photo && announcement.announcement_photo.length > 0        
                            ?   `<div class="property-img-container"> 
                                <img src="/storage/announcement/${announcement.announcement_photo[0].file_name}" class="property-img" alt="${announcement.title}">
                                </div>` 
                            : '<div class="d-flex align-items-center justify-content-center bg-light" style="height: 400px;"><p class="text-muted">Нет фотографий</p></div>'
                        }
                        <div class="card-body">
                            <h5 class="card-title">${announcement.title}</h5>
                            <p class="text-muted"><i class="fas fa-map-marker-alt"></i> ${announcement.address}</p>
                            <div class="d-flex justify-content-between mb-2">
                                <span><i class="fas fa-bed"></i> ${announcement.rooms} ${getRoomWord(announcement.rooms)}</span>
                                <span><i class="fas fa-ruler-combined"></i> ${announcement.area} м²</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <h4 class="text-primary mb-0">${formatPrice(announcement.price)} ₽/мес</h4>
                                <a href="announcement.html?id=${announcement.id}" class="btn btn-sm btn-outline-primary">Подробнее</a>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                $('#announcements-container').append(cardHtml);
            });
            
            // Скрываем индикатор загрузки и показываем контейнер
            $('#loading-announcements').hide();
            $('#announcements-container').show();
        },
        error: function(xhr, status, error) {
            console.error('Ошибка при загрузке объявлений:', error);
            $('#loading-announcements').html('<p class="text-danger">Не удалось загрузить объявления. Пожалуйста, попробуйте позже.</p>');
        }
    });
    
    // Функция для склонения слова "комната"
    function getRoomWord(count) {
        if (count % 100 >= 11 && count % 100 <= 14) {
            return 'комнат';
        }
        switch(count % 10) {
            case 1: return 'комната';
            case 2:
            case 3:
            case 4: return 'комнаты';
            default: return 'комнат';
        }
    }
    
    // Функция для форматирования цены с разделителями тысяч
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    $('#searchForm').on('submit', function(e) {
        e.preventDefault();
        
        // Получаем данные формы
        const address = $('#searchAddress').val();
        const type = $('#searchType').val();
        const price = $('#searchPrice').val();
        
        // Формируем URL с параметрами
        let searchUrl = 'indexSearch.html?';
        const params = [];
        
        if (address) params.push(`address=${encodeURIComponent(address)}`);
        if (type) params.push(`type=${encodeURIComponent(type)}`);
        if (price) params.push(`price=${encodeURIComponent(price)}`);
        
        searchUrl += params.join('&');
        
        // Переходим на страницу поиска
        window.location.href = searchUrl;
    });
});