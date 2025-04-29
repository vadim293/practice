<?php

namespace App\Http\Requests\Announcement;

use Illuminate\Foundation\Http\FormRequest;

class AnnouncementRequest extends FormRequest
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
            'title' => 'required|string',
            'description' => 'required|string',
            'address'=> 'required|string',
            'price' => 'required|integer|min:0',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'type' => 'required|string|in:apartment,house',
            'rooms' => 'required|integer|min:1',
            'area' => 'required|integer|min:1',
            'file_name' => 'sometimes|array',
            'file_name.*' => 'required|image|mimes:jpeg,png,jpg,gif,svg',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Названия объявления не задано',
            'description.required' => 'Описание не задано',
            'address.required' => 'Адрес не найден',
        ];
    }
}
