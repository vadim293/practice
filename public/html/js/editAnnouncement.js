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
    const $photoInput = $('#photos');

    // Загрузка данных объявления
    function loadAnnouncementData() {
        fetch(`/Announcement/2`)
        // fetch(`/Announcement/${announcementId}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки данных');
                return response.json();
            })
            .then(data => {
                console.log('Загруженные данные:', data);
                
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
                    $existingPhotos.empty();
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
            <div class="position-relative existing-photo mb-2" data-photo-id="${photoId}" style="width: 150px; display: inline-block; margin-right: 10px;">
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
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                    'Accept': 'application/json'
                }
            })
            .then(async response => {
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Ошибка удаления');
                }
                $photoElement.remove();
                console.log('Фотография удалена');
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert(error.message || 'Не удалось удалить фотографию');
            });
        }
    });

    // Обработка загрузки новых фото
    $photoInput.on('change', function() {
        const files = this.files;
        if (files.length > 0) {
            // Можно добавить предпросмотр новых фото перед сохранением
            console.log('Выбрано новых фотографий:', files.length);
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

    // Запрос к серверу для подсказок адреса
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
                    console.log('Ответ геокодера:', serverResponse);
                    const response = extractAddresses(serverResponse);
                    
                    if (response && response.length > 0) {
                        showSuggestions(response);
                    } else {
                        showNoResults();
                    }
                } catch (error) {
                    console.error('Ошибка обработки ответа:', error);
                    showError();
                }
            },
            error: function(xhr) {
                console.error('Ошибка запроса:', xhr);
                showError(xhr.status);
            }
        });
    }

    // Функция для извлечения адресов
    function extractAddresses(serverResponse) {            
        if (Array.isArray(serverResponse)) {
            return serverResponse.map(item => ({
                address: item.address || item.name || 'Неизвестный адрес',
                coordinates: item.coordinates || getCoordinatesFromItem(item)
            }));
        }
        
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
        
        if (serverResponse.data) {
            return serverResponse.data.map(item => ({
                address: item.address || item.properties?.name || item.formatted_address || 'Адрес не указан',
                coordinates: item.coordinates || getCoordinatesFromItem(item)
            }));
        }
        
        console.warn('Неизвестный формат ответа:', serverResponse);
        return [];
    }

    // Вспомогательная функция для извлечения координат
    function getCoordinatesFromItem(item) {
        if (item.Point?.pos) {
            const [lon, lat] = item.Point.pos.split(' ');
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        }
        
        if (item.geometry?.coordinates?.length >= 2) {
            return { 
                lon: parseFloat(item.geometry.coordinates[0]),
                lat: parseFloat(item.geometry.coordinates[1])
            };
        }
        
        if (item.lat && item.lon) {
            return { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
        }
        if (item.latitude && item.longitude) {
            return { lat: parseFloat(item.latitude), lon: parseFloat(item.longitude) };
        }
        
        return null;
    }

    // Показ подсказок
    function showSuggestions(addressObjects) {
        $results.empty();
        
        addressObjects.forEach(item => {
            const $suggestionItem = $('<div>')
                .addClass('suggestion-item')
                .text(item.address)
                .click(function() {
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
        console.log('Выбран адрес:', suggestion);
        
        $address.val(suggestion.address)
            .data('selected', true)
            .removeClass('is-invalid');
        
        if (suggestion.coordinates && 
            !isNaN(suggestion.coordinates.lat) && 
            !isNaN(suggestion.coordinates.lon)) {
            
            const lat = parseFloat(suggestion.coordinates.lat).toFixed(6);
            const lon = parseFloat(suggestion.coordinates.lon).toFixed(6);
            
            $latitude.val(lat);
            $longitude.val(lon);
            
            console.log('Установлены координаты:', {lat, lon});
        } else {
            console.error('Невалидные координаты:', suggestion.coordinates);
            $addressError.text('Не удалось определить координаты для этого адреса. Пожалуйста, выберите другой.').show();
            $address.addClass('is-invalid');
            return;
        }
        
        $addressError.hide();
        hideSuggestions();
    }

    // Валидация формы
    function validateForm() {
        let isValid = true;

        // Сброс предыдущих ошибок
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').hide();

        if (!$title.val().trim()) {
            $title.addClass('is-invalid');
            $('#title-error').text('Название объявления обязательно').show();
            isValid = false;
        }

        if (!$price.val() || isNaN($price.val())) {
            $price.addClass('is-invalid');
            $('#price-error').text('Укажите корректную цену').show();
            isValid = false;
        }

        if (!$address.val().trim() || !$latitude.val() || !$longitude.val()) {
            $address.addClass('is-invalid');
            $addressError.text('Пожалуйста, выберите адрес из списка предложений').show();
            isValid = false;
        }

        if (!$type.val()) {
            $type.addClass('is-invalid');
            $('#type-error').text('Выберите тип недвижимости').show();
            isValid = false;
        }

        if (!$rooms.val() || isNaN($rooms.val())) {
            $rooms.addClass('is-invalid');
            $('#rooms-error').text('Укажите количество комнат').show();
            isValid = false;
        }

        if (!$area.val() || isNaN($area.val())) {
            $area.addClass('is-invalid');
            $('#area-error').text('Укажите площадь').show();
            isValid = false;
        }

        return isValid;
    }

    // Обработка отправки формы
    $form.on('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            $('html, body').animate({
                scrollTop: $('.is-invalid').first().offset().top - 100
            }, 500);
            return;
        }

        const formData = new FormData(this);
        formData.append('_method', 'PATCH');

        // Добавляем новые фото
        const photoFiles = $photoInput[0].files;
        for (let i = 0; i < photoFiles.length; i++) {
            formData.append('photos[]', photoFiles[i]);
        }

        // Логирование данных формы
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        fetch(`/updateAnnouncement/2`, {
        // fetch(`/updateAnnouncement/${announcementId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            
            if (!response.ok) {
                // Очистка предыдущих ошибок
                $('.is-invalid').removeClass('is-invalid');
                $('.invalid-feedback').text('').hide();

                if (response.status === 422 && data.errors) {
                    // Обработка ошибок валидации
                    for (const [field, errors] of Object.entries(data.errors)) {
                        const $field = $(`[name="${field}"]`);
                        const $errorElement = $(`#${field}-error`);
                        
                        $field.addClass('is-invalid');
                        if ($errorElement.length) {
                            $errorElement.text(errors[0]).show();
                        } else {
                            $field.after(`<div class="invalid-feedback">${errors[0]}</div>`);
                        }
                    }
                    throw new Error('Проверьте правильность данных');
                }
                throw new Error(data.message || 'Ошибка сохранения');
            }
            
            return data;
        })
        .then(data => {
            console.log('Успешный ответ:', data);
            alert('Изменения сохранены успешно!');
            window.location.href = `/Announcement/${announcementId}`;
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert(error.message || 'Произошла ошибка при сохранении');
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
        if (!$(e.target).closest('.suggestions-container').length && 
            !$(e.target).is($address)) {
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