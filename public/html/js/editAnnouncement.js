$(document).ready(function() {
    // Получаем ID объявления из URL
    // const announcementId = window.location.pathname.split('/').pop();
    // if (!announcementId || isNaN(announcementId)) {
    //     alert('Неверный ID объявления');
    //     window.location.href = '/';
    //     return;
    // }

    // Конфигурация
    const config = {
        minQueryLength: 2,
        debounceDelay: 300,
        maxResults: 5
    };

    // Элементы
    const $form = $('#editAnnouncementForm');
    const $address = $('#address');
    const $suggestions = $('#suggestions');
    const $loader = $('#suggestions-loader');
    const $results = $('#suggestions-results');
    const $latitude = $('#latitude');
    const $longitude = $('#longitude');
    const $addressError = $('#address-error');
    const $existingPhotos = $('#existingPhotos');
    const $title = $('#title');
    const $price = $('#price');
    const $description = $('#description');
    const $type = $('#type');
    const $rooms = $('#rooms');
    const $area = $('#area');

    // Загрузка данных объявления
    function loadAnnouncementData() {
        fetch(`/Announcement/2`)
        // fetch(`/Announcement/${announcementId}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки данных');
                return response.json();
            })
            .then(data => {
                // Заполняем форму
                $title.val(data.title || '');
                $price.val(data.price || '');
                $address.val(data.address || '');
                $latitude.val(data.lat || '');
                $longitude.val(data.lon || '');
                $description.val(data.description || '');
                $type.val(data.type || '');
                $rooms.val(data.rooms || '');
                $area.val(data.area || '');
                
                // Отображаем фотографии
                if (data.announcement_photo && data.announcement_photo.length > 0) {
                    data.announcement_photo.forEach(photo => {
                        addPhotoElement(photo.id, photo.file_name);
                    });
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Не удалось загрузить данные объявления');
            });
    }

    // Добавление элемента фото
    function addPhotoElement(photoId, photoUrl) {
        const photoHtml = `
            <div class="position-relative existing-photo" data-photo-id="${photoId}" style="width: 150px;">
                <img src="/storage/announcement/${photoUrl}" class="img-thumbnail" style="width: 100%; height: 100px; object-fit: cover;">
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 photo-delete-btn" 
                        style="padding: 0.1rem 0.3rem;">
                    ×
                </button>
            </div>
        `;
        $existingPhotos.append(photoHtml);
    }

    // Удаление фото
    $(document).on('click', '.photo-delete-btn', function() {
        const $photoElement = $(this).closest('.existing-photo');
        const photoId = $photoElement.data('photo-id');

        if (confirm('Удалить эту фотографию?')) {
            fetch(`/deleteAnnouncementPhoto/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка удаления');
                $photoElement.remove();
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Не удалось удалить фотографию');
            });
        }
    });

    // Автодополнение адреса
    $address.on('input', debounce(function() {
        const query = $(this).val().trim();
        
        if (query.length < config.minQueryLength) {
            hideSuggestions();
            return;
        }

        fetchSuggestions(query);
    }, config.debounceDelay));

    // Запрос к серверу
    function fetchSuggestions(query) {
        showLoader();
        
        $.ajax({
            url: '/geocoder',
            method: 'GET',
            data: {
                geocode: 'Омск ' + query,
                format: 'json',
                limit: config.maxResults,
            },
            success: function(serverResponse) {
                try {
                    // Преобразуем ответ сервера в массив адресов
                    const response = extractAddresses(serverResponse);
                    
                    if (response && response.length > 0) {
                        showSuggestions(response);
                    } else {
                        showNoResults();
                    }
                } catch (error) {
                    console.error('Ошибка обработки ответа:', error);
                    showNoResults();
                }
            },
            error: function(xhr) {
                console.error('Ошибка запроса:', xhr);
                showError(xhr.status);
            }
        });
    }

    // Функция для извлечения адресов из различных форматов ответа
    function extractAddresses(serverResponse) {            
        console.log('Полный ответ геокодера:', serverResponse);
        
        // Если ответ уже содержит массив адресов
        if (Array.isArray(serverResponse)) {
            return serverResponse.map(item => ({
                address: item.address || item.name || 'Неизвестный адрес',
                coordinates: item.coordinates || getCoordinatesFromItem(item)
            }));
        }
        
        // Обработка структуры Яндекс.Карт
        if (serverResponse.response?.GeoObjectCollection?.featureMember) {
            return serverResponse.response.GeoObjectCollection.featureMember.map(feature => {
                const geoObject = feature.GeoObject || {};
                return {
                    address: geoObject.metaDataProperty?.GeocoderMetaData?.text || 
                        geoObject.name || 
                        'Адрес не указан',
                    coordinates: getCoordinatesFromItem(geoObject)
                };
            });
        }
        
        // Обработка других популярных форматов
        if (serverResponse.data) {
            return serverResponse.data.map(item => ({
                address: item.address || item.properties?.name || item.formatted_address || 'Адрес не указан',
                coordinates: item.coordinates || getCoordinatesFromItem(item)
            }));
        }
        
        console.warn('Неизвестный формат ответа:', serverResponse);
        return [];
    }

    // Вспомогательная функция для извлечения координат из разных структур
    function getCoordinatesFromItem(item) {
        // Яндекс.Карты
        if (item.Point?.pos) {
            const [lon, lat] = item.Point.pos.split(' ');
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        }
        
        // GeoJSON (longitude, latitude)
        if (item.geometry?.coordinates?.length >= 2) {
            return { 
                lon: parseFloat(item.geometry.coordinates[0]),
                lat: parseFloat(item.geometry.coordinates[1])
            };
        }
        
        // Прямые поля
        if (item.lat && item.lon) {
            return { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
        }
        if (item.latitude && item.longitude) {
            return { lat: parseFloat(item.latitude), lon: parseFloat(item.longitude) };
        }
        
        return null;
    }

    // Модифицированная функция showSuggestions
    function showSuggestions(addressObjects) {
        $results.empty();
        
        addressObjects.forEach(item => {
            const $suggestionItem = $('<div>')
                .addClass('suggestion-item')
                .text(item.address)
                .click(function() {
                    if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lon) {
                        console.warn('Координаты не найдены для адреса:', item.address);
                        $addressError.text('Не удалось определить координаты для этого адреса. Пожалуйста, выберите другой.').show();
                        return;
                    }
                    selectSuggestion(item);
                })
                .appendTo($results);
            
            $suggestionItem.data('coordinates', item.coordinates);
        });
        
        $loader.hide();
        $results.show();
        $suggestions.show();
    }
            
    // Выбор подсказки
    function selectSuggestion(suggestion) {
        $address.val(suggestion.address)
            .data('selected', true)
            .removeClass('is-invalid');
        
        // Убедимся, что координаты есть и они валидны
        if (suggestion.coordinates && 
            !isNaN(suggestion.coordinates.lat) && 
            !isNaN(suggestion.coordinates.lon)) {
            
            const lat = parseFloat(suggestion.coordinates.lat).toFixed(6);
            const lon = parseFloat(suggestion.coordinates.lon).toFixed(6);
            
            $latitude.val(lat);
            $longitude.val(lon);
            
            console.log('Координаты установлены:', {lat, lon});
        } else {
            console.error('Невалидные координаты:', suggestion.coordinates);
            $addressError.text('Не удалось определить координаты для этого адреса. Пожалуйста, выберите другой.').show();
            $address.addClass('is-invalid');
            return;
        }
        
        $addressError.hide();
        hideSuggestions();
    }

    // Валидация формы перед отправкой
    function validateForm() {
        let isValid = true;

        // Валидация названия
        if (!$title.val().trim()) {
            $title.addClass('is-invalid');
            $('#title-error').text('Название объявления обязательно').show();
            isValid = false;
        } else {
            $title.removeClass('is-invalid');
            $('#title-error').hide();
        }

        // Валидация цены
        if (!$price.val() || isNaN($price.val())) {
            $price.addClass('is-invalid');
            $('#price-error').text('Укажите корректную цену').show();
            isValid = false;
        } else {
            $price.removeClass('is-invalid');
            $('#price-error').hide();
        }

        // Валидация адреса
        if (!$address.val().trim() || !$latitude.val() || !$longitude.val()) {
            $address.addClass('is-invalid');
            $addressError.text('Пожалуйста, выберите адрес из списка предложений').show();
            isValid = false;
        } else {
            $address.removeClass('is-invalid');
            $addressError.hide();
        }

        // Валидация типа
        if (!$type.val()) {
            $type.addClass('is-invalid');
            $('#type-error').text('Выберите тип недвижимости').show();
            isValid = false;
        } else {
            $type.removeClass('is-invalid');
            $('#type-error').hide();
        }

        // Валидация количества комнат
        if (!$rooms.val() || isNaN($rooms.val())) {
            $rooms.addClass('is-invalid');
            $('#rooms-error').text('Укажите количество комнат').show();
            isValid = false;
        } else {
            $rooms.removeClass('is-invalid');
            $('#rooms-error').hide();
        }

        // Валидация площади
        if (!$area.val() || isNaN($area.val())) {
            $area.addClass('is-invalid');
            $('#area-error').text('Укажите площадь').show();
            isValid = false;
        } else {
            $area.removeClass('is-invalid');
            $('#area-error').hide();
        }

        return isValid;
    }

    // Обработка отправки формы
    $form.on('submit', function(e) {
        e.preventDefault();
        
        // Валидация формы
        if (!validateForm()) {
            alert('Пожалуйста, заполните все обязательные поля корректно');
            return;
        }

        // Подготовка данных
        const formData = new FormData(this);
        
        // Отправка
        fetch(`/updateAnnouncement/2`, {
        // fetch(`/updateAnnouncement/${announcementId}`, {
            method: 'PATCH',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            
            if (!response.ok) {
                // Обработка ошибок валидации
                if (response.status === 422 && data.errors) {
                    for (const [field, errors] of Object.entries(data.errors)) {
                        $(`#${field}`).addClass('is-invalid');
                        $(`#${field}-error`).text(errors[0]).show();
                    }
                    throw new Error('Проверьте правильность данных');
                }
                throw new Error(data.message || 'Ошибка сохранения');
            }
            
            return data;
        })
        .then(data => {
            alert('Изменения сохранены успешно!');
            window.location.href = `/Announcement/${announcementId}`;
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert(error.message);
        });
    });

    // Вспомогательные функции
    function showLoader() {
        $results.hide();
        $loader.show();
        $suggestions.show();
    }

    function showNoResults() {
        $results.html('<div class="suggestion-item text-muted">Ничего не найдено</div>');
        $loader.hide();
        $results.show();
        $suggestions.show();
    }

    function showError(status) {
        const message = status === 422 ? 'Некорректный запрос' : 
                        status === 500 ? 'Ошибка сервера' : 'Ошибка соединения';
        
        $results.html(`<div class="suggestion-item text-danger">${message}</div>`);
        $loader.hide();
        $results.show();
        $suggestions.show();
    }

    function hideSuggestions() {
        $suggestions.hide();
    }

    // Дебаунс
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Закрытие подсказок при клике вне поля
    $(document).click(function(e) {
        if (!$(e.target).closest('.suggestions-container').length) {
            hideSuggestions();
        }
    });

    // Очистка координат при ручном изменении
    $address.on('change', function() {
        if (!$(this).data('selected')) {
            $latitude.val('');
            $longitude.val('');
        }
        $(this).removeData('selected');
    });

    // Загружаем данные при старте
    loadAnnouncementData();
});