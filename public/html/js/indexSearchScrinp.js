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

    // Добавьте эти переменные в начало скрипта
    let currentPage = 1;
    let itemsPerPage = window.innerWidth < 768 ? 10 : 20; // 10 для мобильных, 20 для десктопа
    let totalAnnouncements = 0;
    let allAnnouncements = [];

    // Обновите функцию loadSearchResults
    function loadSearchResults(params) {
        $('#loading-announcements').show();
        $('#announcements-container').hide();
        $('#noResults').hide();
        $('#pagination-container').hide();
        
        $.ajax({
            url: '/search',
            method: 'GET',
            dataType: 'json',
            data: params,
            success: function(data) {
                allAnnouncements = data;
                totalAnnouncements = data.length;
                $('#resultsCount').text(totalAnnouncements);
                
                if (totalAnnouncements === 0) {
                    $('#noResults').show();
                } else {
                    updatePagination();
                    renderAnnouncements();
                    $('#pagination-container').show();
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

    // Обновите функцию renderAnnouncements
    function renderAnnouncements() {
        $('#announcements-container').empty();
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalAnnouncements);
        const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex);
        
        paginatedAnnouncements.forEach(function(announcement) {
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
            window.scrollTo(0, 0);
        }
    });

    $(document).on('click', '#next-page a', function(e) {
        e.preventDefault();
        const totalPages = Math.ceil(totalAnnouncements / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderAnnouncements();
            updatePagination();
            window.scrollTo(0, 0);
        }
    });

    $(document).on('click', 'li.page-item a[data-page]', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (page !== currentPage) {
            currentPage = page;
            renderAnnouncements();
            updatePagination();
            window.scrollTo(0, 0);
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