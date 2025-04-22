$(document).ready(function() {
    // Маска для телефона
    $('#phone').inputmask('+7 (999) 999-99-99');

    // Валидация формы при отправке
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        // Сброс предыдущих ошибок
        $(this).find('.is-invalid').removeClass('is-invalid');
        $('#formError').addClass('d-none').text('');
        
        // Проверка обязательных полей
        $('#first_name, #last_name, #phone, #password, #password_confirmation').each(function() {
            if (!$(this).val().trim()) {
                $(this).addClass('is-invalid');
                isValid = false;
            }
        });
        
        // Проверка длины пароля
        if ($('#password').val().length < 8) {
            $('#password').addClass('is-invalid');
            isValid = false;
        }
        
        // Проверка совпадения паролей
        if ($('#password').val() !== $('#password_confirmation').val()) {
            $('#password_confirmation').addClass('is-invalid');
            isValid = false;
        }
        
        if (!isValid) {
            return false;
        }
        
        // Отправка формы
        $.ajax({
            url: '/register',
            method: 'POST',
            data: $(this).serialize(),
            success: function(response) {
                window.location.href = 'Login.html';
            },
            error: function(xhr) {
                if (xhr.status === 422) {
                    // Обработка ошибок валидации
                    const errors = xhr.responseJSON.errors;
                    for (const field in errors) {
                        $(`#${field}`).addClass('is-invalid');
                        $(`#${field}`).next('.invalid-feedback').text(errors[field][0]);
                    }
                } else {
                    // Общая ошибка
                    $('#formError').removeClass('d-none').text(xhr.responseJSON.message || 'Ошибка регистрации');
                }
            }
        });
    });
    
    // Валидация при вводе
    $('#password_confirmation').on('input', function() {
        if ($(this).val() !== $('#password').val()) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });
    
    // Если есть параметр registered в URL - показываем сообщение
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('registered')) {
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
    }
});