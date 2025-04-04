<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GeocodeRequest extends FormRequest
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
            'geocode' => 'required|string',
            'lang' => 'nullable|string|in:ru_RU,uk_UA,be_BY,en_RU,en_US,tr_TR',
            'sco' => 'nullable|string|in:longlat,latlong|default:longlat',
            'kind' => 'nullable|string|in:house,street,street,metro,district,locality',
            'rspn' => 'nullable|boolean|default:0',
            'll' => 'nullable|string|regex:/^-?\d{1,3}\.\d+,-?\d{1,2}\.\d+$/',
            'spn' => 'nullable|string|regex:/^-?\d{1,2}\.\d+,-?\d{1,2}\.\d+$/',
            'bbox' => 'nullable|string|regex:/^-?\d{1,3}\.\d+,-?\d{1,2}\.\d+~-?\d{1,3}\.\d+,-?\d{1,2}\.\d+$/',
            'results' => 'nullable|integer|min:1|max:50',
            'skip' => 'nullable|integer|min:0|default:0',
            'uri' => 'nullable|string',
            'format' => 'required|in:json',
        ];

    }

    public function messages(): array
    {
        return [
            'geocode.required' => 'Адрес не задан',
            'lang.in' => 'Язык не поддерживается',
            'sco.string' => 'sco должен быть строкой',
            'sco.in' => 'Неправильно задан sco',
            'kind.string' => 'kind должен быть строкой',
            'kind.in' => 'Неправильно задан kind',
            'rspn.boolean' => 'rspn должен быть булевым значением',
            'll.regex' => 'Неверный формат координат',
            'spn.regex' => 'Неверный формат диапазона',
            'bbox.regex' => 'Неверный формат границ',
            'results.integer' => 'Результаты должны быть целым числом',
            'results.min' => 'Результаты должны содержать больше 10 символов',
            'results.max' => 'Результаты должны содержать меньше 50 символов',
            'skip.integer' => 'Пропуск должен быть целым числом',
            'skip.min' => 'Пропуск не может быть больше 0',
            'format.required' => 'Формат не задан',
            'format.in' => 'Формат не json',
        ];
    }
}
