$(document).ready(function() {
    // Функция для получения параметров из URL
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
        
        return params;
    }

    const searchParams = getUrlParams();

    // Показываем параметры поиска
    showSearchParams(searchParams);

    // Загружаем результаты
    loadSearchResults(searchParams);

    function showSearchParams(params) {
        const paramsContainer = $('#searchParams');
        paramsContainer.empty();
        
        if (params.address) {
            paramsContainer.append(`<span class="badge bg-primary">Адрес: ${params.address}</span>`);
        }
        if (params.type) {
            const typeText = {
                'Квартира': 'Квартира',
                'Дом': 'Дом'
            }[params.type] || params.type;
            paramsContainer.append(`<span class="badge bg-info">Тип: ${typeText}</span>`);
        }
        if (params.price) {
            const priceText = {
                '20000': 'до 20,000 ₽',
                '50000': 'до 50,000 ₽',
                '100000': 'до 100,000 ₽',
                '150000': 'до 150,000 ₽'
            }[params.price] || `до ${params.price} ₽`;
            paramsContainer.append(`<span class="badge bg-success">${priceText}</span>`);
        }
    }

    function loadSearchResults(params) {
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#noResults').hide();
        
        // Отправляем запрос к API
        $.ajax({
            url: '/search',
            method: 'GET',
            dataType: 'json',
            data: params,
            success: function(data) {
                $('#resultsCount').text(data.length);
                
                if (data.length === 0) {
                    $('#noResults').show();
                } else {
                    renderAnnouncements(data);
                }
                
                $('#loading-announcements').hide();
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при поиске:', error);
                $('#loading-announcements').html(
                    '<p class="text-danger">Произошла ошибка при поиске. Пожалуйста, попробуйте позже.</p>'
                );
            }
        });
    }
    
    function renderAnnouncements(announcements) {
        $('#announcements-container').empty();
        
        announcements.forEach(function(announcement) {
            const cardHtml = `
            <div class="col-md-6 col-lg-3 my-1">
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
        
        $('#announcements-container').show();
    }
    
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
    
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});