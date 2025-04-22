$(document).ready(function() {
    // Маска для телефона
    $('#phone').inputmask('+7 (999) 999-99-99');

    // Валидация формы при отправке
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        // Сброс предыдущих ошибок
        $(this).find('.is-invalid').removeClass('is-invalid');
        $('#formError').addClass('d-none').text('');
        
        // Проверка обязательных полей
        $('#phone, #password').each(function() {
            if (!$(this).val().trim()) {
                $(this).addClass('is-invalid');
                isValid = false;
            }
        });
        
        if (!isValid) {
            return false;
        }
        
        // Отправка формы
        $.ajax({
            url: '/login',
            method: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                // Сохраняем токен и перенаправляем
                localStorage.setItem('authToken', response.data.token);
                window.location.href = 'addAnnouncements.html';
            },
            error: function(xhr) {
                if (xhr.status === 403) {
                    // Неверные учетные данные
                    $('#formError').removeClass('d-none').text(xhr.responseJSON.message);
                    $('#phone, #password').addClass('is-invalid');
                } else if (xhr.status === 422) {
                    // Ошибки валидации
                    const errors = xhr.responseJSON.errors;
                    for (const field in errors) {
                        $(`#${field}`).addClass('is-invalid');
                        $(`#${field}`).next('.invalid-feedback').text(errors[field][0]);
                    }
                } else {
                    // Общая ошибка
                    $('#formError').removeClass('d-none').text(xhr.responseJSON.message || 'Ошибка входа');
                }
            }
        });
    });
    
    // Если есть параметр registered в URL - показываем сообщение
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('registered')) {
        $('#formError').removeClass('d-none alert-danger').addClass('alert-success')
            .text('Регистрация прошла успешно! Теперь вы можете войти.');
    }
});