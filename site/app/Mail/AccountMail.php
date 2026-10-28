<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Emails about a player's game account: confirm registration, reset password, confirm a new email.
 * One layout (resources/views/mail/account.blade.php), each message a few lines and one button per account.
 */
class AccountMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<string>  $lines  paragraphs before the buttons
     * @param  list<array{label: string, url: string}>  $actions
     * @param  list<string>  $footer  paragraphs after the buttons
     */
    public function __construct(
        public string $title,
        public array $lines,
        public array $actions,
        public array $footer = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "{$this->title} · ".config('l2j.server_name'));
    }

    public function content(): Content
    {
        return new Content(html: 'mail.account', text: 'mail.account-text');
    }
}
