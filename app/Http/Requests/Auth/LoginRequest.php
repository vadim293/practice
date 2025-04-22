<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'phone' => 'required|string|max:18|min:18',
            'password' => 'required|string|min:8',
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Телефон не задан',
            'phone.unique' => 'Данный телефон уже зарегистрирован',
            'phone.min' => 'Телефон введен не полностью',
            'phone.max' => 'Телефон введен слишком длинный',
            'password.required' => 'Пароль не задан',
            'password.min' => 'Пароль должен быть больше 8 симболов',
        ];
    }
}
