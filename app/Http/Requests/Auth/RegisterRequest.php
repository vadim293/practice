<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'patronymic'=> 'required|string',
            'phone' => 'required|string|max:18|min:18|unique:users',
            'password' => 'required|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Фамилия не задана',
            'last_name.required' => 'Имя не задано',
            'patronymic.required' => 'Отчество не задано',
            'phone.required' => 'Телефон не задан',
            'phone.unique' => 'Данный телефон уже зарегистрирован',
            'phone.min' => 'Телефон введен не полностью',
            'phone.max' => 'Телефон введен слишком длинный',
            'password.required' => 'Пароль не задан',
            'password.min' => 'Пароль должен быть больше 8 симболов',
        ];
    }
}
