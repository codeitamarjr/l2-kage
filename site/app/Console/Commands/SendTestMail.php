<?php

namespace App\Console\Commands;

use App\Mail\AccountMail;
use App\Services\GameAccounts;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends one email with the account mail layout, to check the email service (SES, Resend...) end to end.
 */
#[Signature('mail:test {email : Where to send the test email}')]
#[Description('Send a test email to check the email settings')]
class SendTestMail extends Command
{
    public function handle(): int
    {
        $this->line('Mailer: '.config('mail.default').' via '.(config('mail.mailers.smtp.host') ?? '-').':'.(config('mail.mailers.smtp.port') ?? '-')
            .', from '.config('mail.from.address'));
        $this->line('Registration and password resets are '.(GameAccounts::emailReady() ? 'OPEN' : 'CLOSED (email not fully set up)').'.');

        try {
            Mail::to($this->argument('email'))->send(new AccountMail(
                title: 'Test email',
                lines: ['If you can read this, the website can send email: registration and password resets will work.'],
                actions: [['label' => 'Open the website', 'url' => url('/')]],
            ));
        } catch (Throwable $exception) {
            $this->error('Sending failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Sent to '.$this->argument('email').'. Check the inbox (and the spam folder).');

        return self::SUCCESS;
    }
}
