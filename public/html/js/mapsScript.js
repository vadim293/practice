// Функция проверки статуса авторизации
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
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

// Обработчик клика для кнопки выхода
$(document).on('click', '#logout-btn', function(e) {
    e.preventDefault();
    logoutUser();
});

// Инициализация карты
ymaps.ready(initMap);

function initMap() {
    const omskCenter = [54.9924, 73.3686];
    const map = new ymaps.Map('map', {
        center: omskCenter,
        zoom: 12
    });

    // Кластеризатор для группировки меток
    const clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedBlueClusterIcons',
        clusterDisableClickZoom: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel'
    });

    // Группируем объявления по координатам
    fetch('/Announcement')
        .then(response => response.json())
        .then(data => {
            const placemarks = [];
            const announcementsByCoords = {};
            
            // Группируем объявления по координатам
            data.forEach(announcement => {
                if (!announcement.lat || !announcement.lon) return;
                
                const coordsKey = `${announcement.lat}_${announcement.lon}`;
                if (!announcementsByCoords[coordsKey]) {
                    announcementsByCoords[coordsKey] = [];
                }
                announcementsByCoords[coordsKey].push(announcement);
            });
            
            // Создаем метки для каждой группы
            Object.values(announcementsByCoords).forEach(group => {
                const firstAnnouncement = group[0];
                const placemark = createPlacemark(firstAnnouncement, group.length);
                
                // Обработчик клика по метке
                placemark.events.add('click', function(e) {
                    // Открываем сайдбар с объявлениями
                    showAnnouncementsInSidebar(group);
                    
                    // Отменяем открытие балуна
                    e.preventDefault();
                });
                
                placemarks.push(placemark);
            });
            
            // Добавляем метки в кластеризатор
            clusterer.add(placemarks);
            map.geoObjects.add(clusterer);
            
            // Автоматическое масштабирование
            if (placemarks.length > 0) {
                map.setBounds(clusterer.getBounds(), {
                    checkZoomRange: true,
                    zoomMargin: 50
                });
            }
        })
        .catch(error => console.error('Ошибка:', error));
    
    // Функция создания метки
    function createPlacemark(announcement, count) {
        const coords = [parseFloat(announcement.lat), parseFloat(announcement.lon)];
        
        // Иконка с количеством объявлений (если больше одного)
        const iconContent = count > 1 ? count : undefined;
        
        return new ymaps.Placemark(
            coords,
            {
                hintContent: announcement.title,
                iconContent: iconContent
            },
            {
                preset: announcement.type === 'house' 
                    ? 'islands#blueHouseIcon' 
                    : 'islands#blueHomeIcon',
                iconColor: count > 1 ? '#ff0000' : undefined,
                // Отключаем балун по клику
                balloonCloseButton: false,
                hideIconOnBalloonOpen: false
            }
        );
    }
    
    // Функция отображения объявлений в сайдбаре
    function showAnnouncementsInSidebar(announcements) {
        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = '';
        sidebar.classList.add('active');
        
        // Добавляем кнопку закрытия
        const closeButton = document.createElement('div');
        closeButton.className = 'close-sidebar';
        closeButton.innerHTML = '× Закрыть';
        closeButton.onclick = function() {
            sidebar.classList.remove('active');
        };
        sidebar.appendChild(closeButton);
        
        // Добавляем заголовок
        const title = document.createElement('h2');
        title.textContent = 'Объявления по адресу: ' + (announcements[0].address || 'Не указан');
        sidebar.appendChild(title);
        
        // Добавляем карточки объявлений
        announcements.forEach(announcement => {
            const card = document.createElement('div');
            card.className = 'announcement-card';
            
            const content = `
                <h3>${announcement.title || 'Без названия'}</h3>
                <div><strong>Адрес:</strong> ${announcement.address || 'Не указан'}</div>
                <div><strong>Цена:</strong> ${announcement.price ? announcement.price.toLocaleString() + ' руб.' : 'Не указана'}</div>
                ${announcement.rooms ? `<div><strong>Комнат:</strong> ${announcement.rooms}</div>` : ''}
                ${announcement.area ? `<div><strong>Площадь:</strong> ${announcement.area} м²</div>` : ''}
                ${announcement.announcement_photo && announcement.announcement_photo.length > 0 
                    ? `<img src="/storage/announcement/${announcement.announcement_photo[0].file_name}" class="announcement-image">` 
                    : '<div class="no-photo">Нет фотографии</div>'}
                <a href="announcement.html?id=${announcement.id}" class="balloon-link">Подробнее</a>
            `;
            
            card.innerHTML = content;
            sidebar.appendChild(card);
        });
    }
    
    // Обработчик кнопки показа/скрытия сайдбара
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    });
}

// Проверяем статус авторизации при загрузке страницы
$(document).ready(function() {
    checkAuthStatus();
});