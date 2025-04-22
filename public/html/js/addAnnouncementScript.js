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
    const $address = $('#address');
    const $suggestions = $('#suggestions');
    const $loader = $('#suggestions-loader');
    const $results = $('#suggestions-results');
    const $latitude = $('#latitude');
    const $longitude = $('#longitude');
    const $addressError = $('#address-error');
    const $form = $('#announcementForm');

    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    // Обработчик ввода
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
            return null;
        }
        
        $addressError.hide();
        hideSuggestions();
    }

    // Валидация формы перед отправкой - ОБНОВЛЕННАЯ ФУНКЦИЯ
    $form.on('submit', function(e) {
        // Проверяем, что адрес выбран из списка и есть координаты
        const lat = parseFloat($latitude.val());
        const lon = parseFloat($longitude.val());
        
        if (isNaN(lat) || isNaN(lon)) {
            e.preventDefault();
            $address.addClass('is-invalid');
            $addressError.text('Пожалуйста, выберите адрес из списка предложений.').show();
            $('html, body').animate({
                scrollTop: $address.offset().top - 100
            }, 500);
            
            console.error('Координаты не установлены или невалидны');
            return false;
        }
        
        // Логируем данные перед отправкой
        console.log('Данные для отправки:', {
            address: $address.val(),
            latitude: lat,
            longitude: lon,
            // другие поля формы...
        });
        
        return true;
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

    // Валидация формы перед отправкой
    $form.on('submit', function(e) {
        // Проверяем, что адрес выбран из списка и есть координаты
        if (!$latitude.val() || !$longitude.val()) {
            e.preventDefault();
            $address.addClass('is-invalid');
            $addressError.text('Пожалуйста, выберите адрес из списка предложений.').show();
            $('html, body').animate({
                scrollTop: $address.offset().top - 100
            }, 500);
        }
    });
});