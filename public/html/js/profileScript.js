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
    let currentUserId = null;
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'Login.html';
        return;
    }
    // Загрузка данных пользователя
    function loadUserData() {
        $('#profile-name').text('Загрузка...');
        $('#profile-phone').text('Загрузка...');
        
        $.ajax({
            url: '/user',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(user) {
                currentUserId = user.id; 
                updateUserProfile(user);
                initAvatarUpload();
                loadUserAnnouncements(currentUserId); 
            },
            error: function(xhr) {
                console.error('Ошибка при загрузке данных:', xhr);
                $('#profile-name').text('Ошибка загрузки');
                $('#profile-phone').text('Попробуйте позже');
            }
        });
    }
    
    function updateUserProfile(user) {
        let fullName = '';
        if (user.last_name) fullName += user.last_name;
        if (user.first_name) fullName += ' ' + user.first_name;
        if (user.patronymic) fullName += ' ' + user.patronymic;
        
        if (!fullName.trim()) fullName = 'Пользователь';
        
        $('#profile-name').text(fullName);
        
        if (user.phone) {
            $('#profile-phone').text(formatPhoneNumber(user.phone));
        } 
        
        if (user.user_foto) {
            $('#profile-avatar').attr('src', '/storage/userFoto/' + user.user_foto).show();
            $('#default-avatar').hide();
        } else {
            $('#profile-avatar').hide();
            $('#default-avatar').show();
        }
    }
    
    function initAvatarUpload() {
        $('#avatar-container').on('click', function() {
            $('#avatar-upload').click();
        });
        
        $('#avatar-upload').on('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                uploadAvatar(e.target.files[0]);
            }
        });
    }
    
    function uploadAvatar(file) {
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        $.ajax({
            url: '/userFoto',
            method: 'PATCH',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            beforeSend: function() {
                $('#avatar-container').css('opacity', '0.5');
            },
            success: function(response) {
                if (response.success && response.avatar_url) {
                    $('#profile-avatar').attr('src', response.avatar_url).show();
                    $('#default-avatar').hide();
                }
            },
            error: function(xhr) {
                alert('Ошибка при загрузке аватара: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
                console.error(xhr.responseText);
            },
            complete: function() {
                $('#avatar-container').css('opacity', '1');
            }
        });
    }
    
    function formatPhoneNumber(phone) {
        if (!phone) return '';
        const cleaned = ('' + phone).replace(/\D/g, '');
        
        if (cleaned.length === 11 && (cleaned[0] === '7' || cleaned[0] === '8')) {
            return `+7 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
        }
        
        return phone;
    }

    function loadUserAnnouncements(userId) {
        if (!userId) {
            console.error('ID пользователя не определен');
            $('#loading-announcements').hide();
            $('#no-announcements').show();
            return;
        }
        
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#no-announcements').hide();
        
        $.ajax({
            url: `/user/Announcement/${userId}`,
            method: 'GET',
            success: function(announcements) {
                $('#loading-announcements').hide();
                
                if (announcements && announcements.length > 0) {
                    renderAnnouncements(announcements);
                    $('#announcements-container').show();
                } else {
                    $('#no-announcements').show();
                }
            },
            error: function(xhr) {
                $('#loading-announcements').hide();
                console.error('Ошибка при загрузке объявлений:', xhr.responseText);
                $('#no-announcements').show();
            }
        });
    }

    function renderAnnouncements(announcements) {
        const container = $('#announcements-container');
        container.empty();
        
        announcements.forEach(announcement => {     
            const cardHtml = `
                <div class="col-md-6 col-lg-4 col-xl-3">
                    <div class="card h-100">
                       ${announcement.announcement_photo && announcement.announcement_photo.length > 0        
                            ?   `<div class="property-img-container"> 
                                <img src="/storage/announcement/${announcement.announcement_photo[0].file_name}" class="property-img" alt="${announcement.title}">
                                </div>` 
                            : '<div class="d-flex align-items-center justify-content-center bg-light" style="height: 350px;"><p class="text-muted">Нет фотографий</p></div>'
                        }
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${announcement.title || 'Без названия'}</h5>
                            <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${announcement.address || 'Адрес не указан'}</p>
                            <div class="d-flex justify-content-between mb-2">
                                <span><i class="fas fa-bed me-1"></i> ${announcement.rooms || '?'} ${getRoomWord(announcement.rooms)}</span>
                                <span><i class="fas fa-ruler-combined me-1"></i> ${announcement.area || '?'} м²</span>
                            </div>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="text-primary mb-0">${formatPrice(announcement.price)} ₽/мес</h5>
                                    <div>
                                        <a href="editAnnouncements.html?id=${announcement.id}" class="btn btn-sm btn-outline-secondary me-1">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <button class="btn btn-sm btn-outline-danger delete-announcement" data-id="${announcement.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <a href="announcement.html?id=${announcement.id}" class="btn btn-primary w-100 mt-2">Подробнее</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.append(cardHtml);
        });
    }

    function getRoomWord(count) {
        if (!count) return 'комнат';
        if (count % 100 >= 11 && count % 100 <= 14) return 'комнат';
        switch(count % 10) {
            case 1: return 'комната';
            case 2: case 3: case 4: return 'комнаты';
            default: return 'комнат';
        }
    }

    function formatPrice(price) {
        if (!price) return '0';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    $(document).on('click', '.delete-announcement', function() {
        const id = $(this).data('id');
        const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        
        $('#confirm-delete-btn').off('click').on('click', function() {
            const $btn = $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status"></span> Удаление...');
            
            $.ajax({
                url: `/deleteAnnouncement/${id}`,
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function() {
                    modal.hide();
                    loadUserAnnouncements();
                },
                error: function(xhr) {
                    alert(xhr.responseJSON?.message || 'Ошибка при удалении объявления');
                },
                complete: function() {
                    $btn.prop('disabled', false).text('Удалить');
                }
            });
        });
        
        modal.show();
    });

    // Инициализация
    loadUserData();
    loadUserAnnouncements();
});