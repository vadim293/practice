$(document).ready(function() {
    // Получаем параметры поиска из URL
    const urlParams = new URLSearchParams(window.location.search);
    const address = urlParams.get('address');
    
    // Показываем параметры поиска
    showSearchParams(address);
    
    // Загружаем результаты поиска
    loadSearchResults(address);
    
    function showSearchParams(address) {
        const paramsContainer = $('#searchParams');
        
        if (address) {
            paramsContainer.append(`<span class="badge bg-primary">Адрес: ${address}</span>`);
        }
    }
    
    function loadSearchResults(address) {
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#noResults').hide();
        
        const params = { };
        if (address) params.address = address;
        
        $.ajax({
            url: `/search/${address}`,
            method: 'GET',
            dataType: 'json',
            data: params,
            success: function(data) {
                console.log(data);
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
                $('#loading-announcements').html('<p class="text-danger">Произошла ошибка при поиске. Пожалуйста, попробуйте позже.</p>');
            }
        });
    }
    
    function renderAnnouncements(announcements) {
        $('#announcements-container').empty();
        
        announcements.forEach(function(announcement) {
            const cardHtml = `
            <div class="col-md-6 col-lg-4 my-1">
                <div class="card property-card h-100">
                    <div class="property-img-container">
                        ${announcement.announcement_photo && announcement.announcement_photo.length > 0 
                        ? `<img src="/storage/announcement/${announcement.announcement_photo[0].file_name}" class="property-img" alt="${announcement.title}">` 
                        : '<div class="no-photo d-flex align-items-center justify-content-center bg-light" style="height: 100%;">Нет фотографии</div>'}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${announcement.title}</h5>
                        <p class="text-muted"><i class="fas fa-map-marker-alt"></i> ${announcement.address}</p>
                        <div class="d-flex justify-content-between mb-2">
                            <span><i class="fas fa-bed"></i> ${announcement.rooms} ${getRoomWord(announcement.rooms)}</span>
                            <span><i class="fas fa-ruler-combined"></i> ${announcement.area} м²</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <h4 class="text-primary mb-0">${formatPrice(announcement.price)} ₽/мес</h4>
                            <a href="/Announcement/${announcement.id}" class="btn btn-sm btn-outline-primary">Подробнее</a>
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