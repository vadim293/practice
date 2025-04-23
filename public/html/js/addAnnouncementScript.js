$(document).ready(function() {
    const token = localStorage.getItem('authToken');
    console.log(token);
    
    if (!token) {
        window.location.href = 'Login.html';
        return;
    }
    
    // Конфигурация
    const config = {
        minQueryLength: 2,
        debounceDelay: 300,
        maxResults: 5
    };

    // Элементы
    const $form = $('#announcementForm');
    const $address = $('#address');
    const $suggestions = $('#suggestions');
    const $loader = $('#suggestions-loader');
    const $results = $('#suggestions-results');
    const $latitude = $('#latitude');
    const $longitude = $('#longitude');
    const $addressError = $('#address-error');
    const $title = $('#title');
    const $price = $('#price');
    const $description = $('#description');
    const $type = $('#type');
    const $rooms = $('#rooms');
    const $area = $('#area');
    const $photoInput = $('#photos');
    const $photoPreview = $('#photoPreview');

    // Обработчик ввода адреса
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

        // Проверка фотографий (необязательно)
        if ($photoInput[0].files.length === 0) {
            console.log('Фотографии не загружены, но это не обязательно');
        }

        return isValid;
    }

    // Обработка загрузки фотографий
    $photoInput.on('change', function() {
        const files = this.files;
        $photoPreview.empty();
        
        if (files.length > 0) {
            console.log('Выбрано фотографий:', files.length);
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const previewHtml = `
                        <div class="position-relative photo-preview mb-2" style="width: 150px; display: inline-block; margin-right: 10px;">
                            <img src="${e.target.result}" class="img-thumbnail" style="width: 100%; height: 100px; object-fit: cover;">
                        </div>
                    `;
                    $photoPreview.append(previewHtml);
                };
                
                reader.readAsDataURL(file);
            }
        }
    });

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
        
        // Добавляем координаты
        formData.append('latitude', $latitude.val());
        formData.append('longitude', $longitude.val());

        // Добавляем токен авторизации
        formData.append('token', token);

        // Проверка содержимого FormData
        for (let [key, value] of formData.entries()) {
            console.log(key, value instanceof File ? value.name : value);
        }
    
        fetch('/adderAnnouncement', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(async response => {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (!response.ok) {
                    return Promise.reject(data);
                }
                return data;
            } catch (e) {
                throw new Error(text || 'Неверный формат ответа');
            }
        })
        .then(data => {
            console.log('Успешный ответ:', data);
            alert('Объявление успешно создано!');
            window.location.href = `/index.html`;
        })
        .catch(error => {
            console.error('Ошибка:', error);
            
            $('.is-invalid').removeClass('is-invalid');
            $('.invalid-feedback').text('').hide();
    
            if (error.errors) {
                for (const [field, errors] of Object.entries(error.errors)) {
                    const $field = $(`[name="${field}"]`);
                    const $errorElement = $(`#${field}-error`);
                    
                    $field.addClass('is-invalid');
                    if ($errorElement.length) {
                        $errorElement.text(errors[0]).show();
                    } else {
                        $field.after(`<div class="invalid-feedback">${errors[0]}</div>`);
                    }
                }
                alert('Проверьте правильность данных');
            } else {
                alert(error.message || 'Произошла ошибка при создании объявления');
            }
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
});