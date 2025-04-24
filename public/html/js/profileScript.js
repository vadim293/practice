$(document).ready(function() {
    // Загрузка данных пользователя
    function loadUserData() {
        // Здесь должен быть запрос к API для получения данных пользователя
        // Пример:
        $.ajax({
            url: '/user',
            method: 'GET',
            success: function(user) {
                $('#profile-name').text(user.firstName + ' ' + user.lastName);
                $('#profile-email').text(user.email);
                $('#first-name').val(user.firstName);
                $('#last-name').val(user.lastName);
                $('#email').val(user.email);
                $('#phone').val(user.phone);
                if (user.avatar) {
                    $('#profile-avatar').attr('src', user.avatar);
                }
            }
        });
    }

    // Загрузка объявлений пользователя
    function loadUserAnnouncements() {
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#no-announcements').hide();
        
        $.ajax({
            url: '/Announcement',
            method: 'GET',
            success: function(announcements) {
                $('#loading-announcements').hide();
                
                if (announcements.length > 0) {
                    renderAnnouncements(announcements);
                    $('#announcements-container').show();
                } else {
                    $('#no-announcements').show();
                }
            }
        });
    }

    // Отображение объявлений
    function renderAnnouncements(announcements) {
        const container = $('#announcements-container');
        container.empty();
        
        announcements.forEach(announcement => {
            const cardHtml = `
                <div class="col-md-3">
                    <div class="card property-card h-100">
                        ${announcement.announcement_photo && announcement.announcement_photo.length > 0        
                            ?   `<div class="property-img-container"> 
                                <img src="/storage/announcement/${announcement.announcement_photo[0].file_name}" class="property-img" alt="${announcement.title}">
                                </div>` 
                            : '<div class="d-flex align-items-center justify-content-center bg-light" style="height: 300px;"><p class="text-muted">Нет фотографий</p></div>'
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
                                <div>
                                    <a href="editAnnouncements.html?id=${announcement.id}" class="btn btn-sm btn-outline-secondary me-1">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <button class="btn btn-sm btn-outline-danger delete-announcement" data-id="${announcement.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>   
                            </div>
                        </div>
                        <a href="announcement.html?id=${announcement.id}" class="btn btn-sm btn-outline-primary">Подробнее</a>
                    </div>
                </div>
            `;
            container.append(cardHtml);
        });
    }

    // Вспомогательные функции
    function getRoomWord(count) {
        if (count % 100 >= 11 && count % 100 <= 14) return 'комнат';
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


    $(document).on('click', '.delete-announcement', function() {
        const id = $(this).data('id');
        const button = $(this);
        
        // Подтверждение удаления
        if (confirm('Вы уверены, что хотите удалить это объявление?')) {
            button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
            
            $.ajax({
                url: `/deleteAnnouncement/${id}`,
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') // Для Laravel CSRF защиты
                },
                success: function() {
                    // Успешное удаление - перезагружаем список объявлений
                    loadUserAnnouncements();
                },
                error: function(xhr) {
                    button.prop('disabled', false).html('<i class="fas fa-trash"></i>');
                    const message = xhr.responseJSON && xhr.responseJSON.message 
                        ? xhr.responseJSON.message 
                        : 'Произошла ошибка при удалении объявления';
                }
            });
        }
    });


    // Инициализация
    loadUserData();
    loadUserAnnouncements();
});