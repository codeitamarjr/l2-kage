<?php

/*
 * Brazilian Portuguese for the validation rules the site uses; the forms' own messages (password, account name...)
 * are in lang/pt_BR.json.
 */
return [
    'confirmed' => 'A confirmação de :attribute não coincide.',
    'email' => 'Digite um :attribute válido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'max' => [
        'string' => 'O campo :attribute deve ter no máximo :max caracteres.',
    ],
    'min' => [
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'regex' => 'O formato de :attribute é inválido.',
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute deve ser um texto.',

    'attributes' => [
        'login' => 'nome da conta',
        'email' => 'e-mail',
        'password' => 'senha',
        'current_password' => 'senha atual',
        'email_password' => 'senha atual',
        'character_id' => 'personagem',
    ],
];
