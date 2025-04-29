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
                initAvatarUpload(currentUserId);
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
    
        // Проверяем наличие аватара
        if (user.user_foto) {
            $('#profile-avatar').attr('src', `/storage/userFoto/${user.user_foto}`).show();
            $('#default-avatar').hide();
            $('#delete-avatar-btn').show(); // Показываем кнопку удаления
        } else {
            $('#profile-avatar').hide();
            $('#default-avatar').show();
            $('#delete-avatar-btn').hide(); // Скрываем кнопку удаления
        }
    }
    
    function initAvatarUpload(currentUserId) {
        $('#user_foto').on('change', function(e) {
            
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];  
                uploadAvatar(currentUserId, file); 
            }
        });
    }
    
    function uploadAvatar(currentUserId,file) {
        if (!file) {
            alert('Файл не выбран');
            return;
        }
    
        const formData = new FormData();
        formData.append('id', currentUserId);
        formData.append('user_foto', file);
        formData.append('_method', 'PATCH'); 
    
        $.ajax({
            url: '/userFoto',
            method: 'POST',
            data: formData,
            processData: false, // Важно для FormData!
            contentType: false, // Важно для FormData!
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                if (response) {
                    // Обновляем аватар
                    $('#profile-avatar').attr('src', `/storage/userFoto/${response}`).show();
                    $('#default-avatar').hide(); 
                }
                location.reload(true);
            },
            error: function(xhr) {
                alert('Ошибка при загрузке аватара: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
            }
            
        });
    }
    
    function deleteAvatar(userId) {
        if (!confirm('Вы уверены, что хотите удалить аватар?')) {
            return;
        }
    
        $.ajax({
            url: `/userFoto/${userId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function() {
                // Успешно удалено - обновляем отображение
                $('#profile-avatar').hide();
                $('#default-avatar').show();
                $('#delete-avatar-btn').hide();
                $('#profile-avatar').attr('src', ''); // Очищаем src
            },
            error: function(xhr) {
                alert('Ошибка при удалении аватара: ' + (xhr.responseJSON?.message || 'Неизвестная ошибка'));
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

    let currentPage = 1;
    let itemsPerPage = window.innerWidth < 768 ? 10 : 20; // 10 для мобильных, 20 для десктопа
    let totalAnnouncements = 0;
    let allAnnouncements = [];
    
    // Обновите функцию loadUserAnnouncements
    function loadUserAnnouncements(userId) {
        if (!userId) {
            $('#loading-announcements').hide();
            $('#no-announcements').show();
            return;
        }
        
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#no-announcements').hide();
        $('#pagination-container').hide();
        
        $.ajax({
            url: `/user/Announcement/${userId}`,
            method: 'GET',
            success: function(announcements) {
                allAnnouncements = announcements || [];
                totalAnnouncements = allAnnouncements.length;
                $('#loading-announcements').hide();
                
                if (totalAnnouncements > 0) {
                    updatePagination();
                    renderAnnouncements();
                    $('#pagination-container').show();
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
    
    // Обновите функцию renderAnnouncements
    function renderAnnouncements() {
        const container = $('#announcements-container');
        container.empty();
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalAnnouncements);
        const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex);
        
        paginatedAnnouncements.forEach(announcement => {     
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
        
        container.show();
    }
    
    // Добавьте новые функции для пагинации
    function updatePagination() {
        const totalPages = Math.ceil(totalAnnouncements / itemsPerPage);
        const $pagination = $('#pagination-container ul');
        
        // Очищаем все страницы кроме текущей, предыдущей и следующей
        $pagination.find('li.page-item:not(.active):not(#prev-page):not(#next-page)').remove();
        
        // Обновляем предыдущую страницу
        $('#prev-page').toggleClass('disabled', currentPage === 1);
        
        // Обновляем следующую страницу
        $('#next-page').toggleClass('disabled', currentPage === totalPages);
        
        // Добавляем номера страниц
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        // Вставляем страницы перед активной
        if (startPage > 1) {
            $('<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>')
                .insertAfter('#prev-page');
            if (startPage > 2) {
                $('<li class="page-item disabled"><span class="page-link">...</span></li>')
                    .insertAfter('#prev-page').next();
            }
        }
        
        // Вставляем страницы вокруг активной
        for (let i = startPage; i <= endPage; i++) {
            if (i !== currentPage) {
                $(`<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`)
                    .insertBefore('#next-page');
            }
        }
        
        // Вставляем страницы после активной
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                $('<li class="page-item disabled"><span class="page-link">...</span></li>')
                    .insertBefore('#next-page');
            }
            $(`<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`)
                .insertBefore('#next-page');
        }
        
        // Обновляем активную страницу
        $pagination.find('li.active').removeClass('active');
        $(`li.page-item a[data-page="${currentPage}"]`).parent().addClass('active');
    }
    
    // Обработчики событий для пагинации
    $(document).on('click', '#prev-page a', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderAnnouncements();
            updatePagination();
            window.scrollTo(0, $('#announcements-container').offset().top - 20);
        }
    });
    
    $(document).on('click', '#next-page a', function(e) {
        e.preventDefault();
        const totalPages = Math.ceil(totalAnnouncements / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderAnnouncements();
            updatePagination();
            window.scrollTo(0, $('#announcements-container').offset().top - 20);
        }
    });
    
    $(document).on('click', 'li.page-item a[data-page]', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (page !== currentPage) {
            currentPage = page;
            renderAnnouncements();
            updatePagination();
            window.scrollTo(0, $('#announcements-container').offset().top - 20);
        }
    });
    
    // Обработчик изменения размера окна для обновления itemsPerPage
    $(window).on('resize', function() {
        const newItemsPerPage = window.innerWidth < 768 ? 10 : 20;
        if (newItemsPerPage !== itemsPerPage) {
            itemsPerPage = newItemsPerPage;
            currentPage = 1;
            if (allAnnouncements.length > 0) {
                renderAnnouncements();
                updatePagination();
            }
        }
    });
    
    // Обновите обработчик удаления объявлений, чтобы он перезагружал пагинацию
    $(document).on('click', '.delete-announcement', function() {
        const id = $(this).data('id');
        const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        
        $('#confirm-delete-btn').off('click').on('click', function() {
            const $btn = $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status"></span> Удаление...');
            
            $.ajax({
                url: `/deleteAnnouncement/${id}`,
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                    'Authorization': `Bearer ${token}`
                },
                success: function() {
                    modal.hide();
                    // Перезагружаем объявления с учетом пагинации
                    loadUserAnnouncements(currentUserId);
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


    // Инициализация
    loadUserData();
    loadUserAnnouncements();
});